import { join } from 'node:path';

import compression from 'compression';
import express, {
  type Express,
  json,
  type RequestHandler,
  Router,
} from 'express';
import fastGlob from 'fast-glob';
import helmet from 'helmet';
import { getReasonPhrase, StatusCodes } from 'http-status-codes';
import { type PathItemObject, type PathsObject } from 'openapi3-ts';

import { ApiConfigSchema } from './api-config/api-config.js';
import { getCachingStrategy } from './caching/caching-resolver.js';
import {
  type ConfigCaching,
  ConfigCachingPathSchema,
} from './config/config-caching.js';
import { getConfig } from './config/config.js';
import { ErrorCodes } from './error-codes.js';
import {
  type ErrorResponse,
  type ErrorResponseErrorObject,
} from './error-response.js';
import { getHttpClient } from './http-client/get-http-client.js';
import { type HttpClientRequestOptions } from './http-client/http-client.js';
import { internalConfiguration } from './internal-configuration.js';
import { mapBody } from './map-body.js';
import { mapHeaders } from './map-headers.js';
import { mapParams } from './map-params.js';
import { mapQuery } from './map-query.js';
import { MethodSchema } from './method.js';
import { notFoundMiddleware } from './not-found-middleware.js';
import { configureOpenapi } from './openapi/configure-openapi.js';
import { getOperation } from './openapi/get-operation.js';
import { validateParams } from './validate-params.js';
import { fromZodErrorToErrorResponseObjects } from './zod-error-formatter.js';

const EXTENSION = 'js';
const DIST = 'dist';
const ROUTES = `${DIST}/routes`;

interface InitApiConfigResultMeta {
  method: string;
  openapi?: PathItemObject | null;
}
type InitApiConfigResult = [string, RequestHandler, InitApiConfigResultMeta];

async function initApiConfig(path: string): Promise<InitApiConfigResult> {
  const globalConfig = await getConfig();
  const reqPath = path
    .replace(ROUTES, '')
    .split('/')
    .map((part) => part.replace('[', ':').replace(/]$/, ''));
  const method = MethodSchema.parse(
    reqPath.pop()!.replace(new RegExp(`\\.${EXTENSION}$`), '')
  );
  const file = await import(join('file://', process.cwd(), path));
  const apiConfig = file.default;
  if (!apiConfig) {
    throw new Error(`File ${path} does not have a default export`);
  }
  const parsedApiConfig = await ApiConfigSchema.safeParseAsync(apiConfig);
  if (!parsedApiConfig.success) {
    // TODO better error message
    throw new Error(`File ${path} does not contain valid configuration`);
  }
  const {
    host,
    path: pathname,
    mapping,
    openapi,
    caching,
  } = parsedApiConfig.data;
  const endPoint = `${reqPath.join('/')}`;
  const operation = globalConfig.openapi
    ? getOperation(parsedApiConfig.data)
    : null;
  return [
    endPoint,
    async (req, res, next) => {
      if (req.method.toLowerCase() !== method.toLowerCase()) {
        next();
        return;
      }
      const [params, headers, body, query] = await Promise.all([
        mapParams(mapping?.in?.params, req),
        mapHeaders(mapping?.in?.headers, req),
        method === 'GET'
          ? Promise.resolve(undefined)
          : mapBody(mapping?.in?.body, req),
        mapQuery(mapping?.in?.query, req),
      ]);
      let newPathName = pathname;
      const badRequestErrors: ErrorResponseErrorObject[] = [];
      const headerSchema = openapi?.request?.headers;
      if (headerSchema) {
        const errors = await validateParams(headerSchema, headers, 'headers');
        badRequestErrors.push(...errors);
      }
      const querySchema = openapi?.request?.query;
      if (querySchema) {
        const errors = await validateParams(querySchema, query, 'query');
        badRequestErrors.push(...errors);
      }
      const paramsSchema = openapi?.request?.params;
      if (paramsSchema) {
        const errors = await validateParams(paramsSchema, params, 'params');
        badRequestErrors.push(...errors);
      }
      for (const paramKey of endPoint.split('/')) {
        if (!paramKey.startsWith(':')) {
          continue;
        }
        const paramKeyParsed = paramKey.replace(/^:/, '');
        const paramValue = params[paramKeyParsed];
        if (paramValue == null) {
          badRequestErrors.push({
            path: paramKeyParsed,
            message: `${paramKeyParsed} is required`,
            type: 'params',
          });
        }
        newPathName = newPathName.replace(paramKey, paramValue);
      }
      const requestOptions: HttpClientRequestOptions = {
        method,
        headers,
      };
      const bodyZodSchema = openapi?.request?.body;
      if (bodyZodSchema) {
        const errors = await validateParams(bodyZodSchema, body, 'body');
        badRequestErrors.push(...errors);
      }
      if (body) {
        requestOptions.body = JSON.stringify(body);
      }
      if (badRequestErrors.length) {
        const errorResponse = {
          status: StatusCodes.BAD_REQUEST,
          errors: badRequestErrors,
          error: getReasonPhrase(StatusCodes.BAD_REQUEST),
          message: 'Invalid parameters', // TODO better error message
          code: ErrorCodes.BadRequest,
        } satisfies ErrorResponse;
        res.status(StatusCodes.BAD_REQUEST).send(errorResponse);
        return;
      }
      const urlSearchParams = new URLSearchParams(query);
      const url = new URL(newPathName, `https://${host}`);
      console.log(`Sending request to ${url}`);
      urlSearchParams.forEach((value, key) => {
        url.searchParams.append(key, value);
      });
      console.log('Request params: ', {
        ...requestOptions,
        query,
        params,
      });
      const hasCachingConfig =
        caching !== false && (!!globalConfig.caching || !!caching);
      const shouldCache = method === 'GET' && hasCachingConfig;
      const newCaching = (
        hasCachingConfig
          ? {
              type: caching?.type ?? globalConfig.caching?.type ?? 'memory',
              path: ConfigCachingPathSchema.parse(globalConfig.caching?.path),
              ttl: caching?.ttl ?? globalConfig.caching?.ttl,
            }
          : { type: 'memory', path: '' }
      ) satisfies ConfigCaching;
      let cacheUsed = false;
      // TODO define what will compose the cache key
      const cacheKey = `${url.toString()};;;;meta=${JSON.stringify({
        authorization: headers.authorization,
      })}`;
      const cachingStrategy = getCachingStrategy(newCaching.type!);
      if (shouldCache) {
        const cachedValue = await cachingStrategy
          .get(cacheKey, newCaching)
          .catch(() => null);
        if (cachedValue != null) {
          console.log('Using cached value');
          res.status(StatusCodes.OK).send(cachedValue);
          cacheUsed = true;
        }
      }
      const httpClient = await getHttpClient();
      const response = await httpClient.request(url, requestOptions);
      if (!response.ok) {
        if (cacheUsed) {
          return;
        }
        res
          .status(response.status)
          .send(
            (await response.json().catch(() => null)) ?? (await response.text())
          );
        return;
      }
      let data = await response.json();
      if (mapping?.out?.body) {
        // TODO map out body
        // TODO map out body in case of errors
      }
      console.log(res.header);
      if (openapi?.response?.ok) {
        const parsedResponse = await openapi.response.ok.safeParseAsync(data);
        if (!parsedResponse.success) {
          const error: ErrorResponse = {
            error: getReasonPhrase(StatusCodes.MISDIRECTED_REQUEST),
            status: StatusCodes.MISDIRECTED_REQUEST,
            message: 'The response from the server has data validation errors',
            errors: fromZodErrorToErrorResponseObjects(
              parsedResponse.error,
              'body'
            ),
            code: ErrorCodes.ResponseValidationError,
          };
          res.status(StatusCodes.MISDIRECTED_REQUEST).send(error);
          return;
        }
        data = parsedResponse.data;
      }
      if (shouldCache) {
        cachingStrategy.set(cacheKey, data, newCaching).catch(() => null);
        console.log('New value cached');
      }
      if (cacheUsed) {
        return;
      }
      res.status(StatusCodes.OK).send(data);
    },
    { method, openapi: { [method.toLowerCase()]: operation } },
  ];
}

export async function createApplication(): Promise<Express> {
  const server = express().use(helmet()).use(compression()).use(json());
  const config = await getConfig();
  console.log('config', config);
  const middleGlob = '/**/{GET,POST,PUT,PATCH,DELETE}';
  const globPath = `${ROUTES}${middleGlob}.${EXTENSION}`;
  const paths = await fastGlob(globPath);
  const middlewares = await Promise.all(
    paths.map((path) => initApiConfig(path))
  );
  const middlewaresSorted = [...middlewares].sort(
    ([endPointA], [endPointB]) => endPointB.length - endPointA.length
  );
  const openapiPaths: PathsObject = {};
  const router = Router();
  for (const [endPoint, handler, meta] of middlewaresSorted) {
    const finalEndPoint = `${config.prefix}${endPoint}`;
    console.log(
      `Registering end-point: [${meta.method.toUpperCase()}] ${finalEndPoint}`
    );
    router.use(endPoint, handler);
    if (meta.openapi) {
      openapiPaths[endPoint] = { ...openapiPaths[endPoint], ...meta.openapi };
    }
  }
  await configureOpenapi(router, openapiPaths);
  server.use(config.prefix ?? '/', router);
  await internalConfiguration(server);
  return server.use(notFoundMiddleware());
}
