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
import { StatusCodes } from 'http-status-codes';
import { type PathItemObject, type PathsObject } from 'openapi3-ts';

import { ApiConfigSchema } from './api-config/api-config.js';
import { getCachingStrategy } from './caching/caching-resolver.js';
import {
  type ConfigCaching,
  ConfigCachingPathSchema,
} from './config/config-caching.js';
import { getConfig } from './config/config.js';
import { ErrorCodes } from './error-codes.js';
import { errorMiddleware } from './error-middleware.js';
import { ErrorResponse } from './error-response.js';
import { formatHeaders } from './format-headers.js';
import { formatQuery } from './format-query.js';
import { getProviderValidationErrorResponse } from './get-provider-validation-error-response.js';
import { getHttpClient } from './http-client/get-http-client.js';
import { type HttpClientRequestOptions } from './http-client/http-client.js';
import { methodHasBody } from './http-client/method-has-body.js';
import { internalConfiguration } from './internal-configuration.js';
import { mapRequestBody } from './map-request-body.js';
import { mapRequestOtherParams } from './map-request-other-params.js';
import { mapRequestParams } from './map-request-params.js';
import { mapResponseBody } from './map-response-body.js';
import { MethodSchema } from './method.js';
import { notFoundMiddleware } from './not-found-middleware.js';
import { configureOpenapi } from './openapi/configure-openapi.js';
import { formatEndPoint } from './openapi/format-end-point.js';
import { getOperation } from './openapi/get-operation.js';
import { validateParams } from './validate-params.js';
import { fromZodErrorToErrorResponseObjects } from './zod-error-formatter.js';

const EXTENSION = 'js';
const DIST = 'dist';
const ROUTES = `${DIST}/src/routes`;

interface InitApiConfigResultMeta {
  method: string;
  openapi?: PathItemObject | null;
}
type InitApiConfigResult = [string, RequestHandler, InitApiConfigResultMeta];

async function initApiConfig(path: string): Promise<InitApiConfigResult> {
  const globalConfig = await getConfig();
  const pathWithoutDist = path.replace(ROUTES, '');
  const reqPath = pathWithoutDist
    .split('/')
    .map((part) => part.replace('[', ':').replace(/]$/, ''));
  const regexExtension = new RegExp(`\\.${EXTENSION}$`);
  const method = MethodSchema.parse(reqPath.pop()!.replace(regexExtension, ''));
  const file = await import(join('file://', process.cwd(), path));
  const apiConfig = file.default;
  const pathWithoutExtension = pathWithoutDist.replace(regexExtension, '');
  if (!apiConfig) {
    throw new Error(
      `File ${pathWithoutExtension} does not have a default export`
    );
  }
  const parsedApiConfig = await ApiConfigSchema.safeParseAsync(apiConfig);
  if (!parsedApiConfig.success) {
    const errors = fromZodErrorToErrorResponseObjects(
      parsedApiConfig.error,
      'body'
    );
    throw new Error(
      `File ${pathWithoutExtension} does not contain valid configuration.\n` +
        `Errors:\n` +
        `${errors
          .map((error) => `- "${error.path}" ${error.message}`)
          .join('\n')}`
    );
  }
  const {
    host,
    path: pathname,
    caching,
    request,
    response,
  } = parsedApiConfig.data;
  const endPoint = reqPath.join('/');
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
      res.setHeader('x-api-bff', 'true');
      let params = await validateParams({
        data: req.params,
        schema: request?.validation?.params,
        type: 'params',
      });
      if (request?.mapping?.params) {
        params = await mapRequestParams(request.mapping.params, params, req);
      }
      const formattedQuery = formatQuery(req.query);
      const parsedQuery = await validateParams({
        data: formattedQuery,
        type: 'query',
        schema: request?.validation?.query,
      });
      let query: Record<string, string> = {};
      if (request?.mapping?.query) {
        query = formatQuery(parsedQuery);
        query = await mapRequestOtherParams(
          request.mapping.query,
          formatQuery(parsedQuery),
          req
        );
      }

      const formattedHeaders = formatHeaders(req.headers);
      const parsedHeaders = await validateParams({
        data: formattedHeaders,
        type: 'headers',
        schema: request?.validation?.headers,
      });
      let headers: Record<string, string> = {};
      if (request?.mapping?.headers) {
        headers = await mapRequestOtherParams(
          request.mapping.headers,
          formatHeaders(parsedHeaders),
          req
        );
      }
      let body: unknown | null = null;
      if (methodHasBody(method)) {
        const parsedBody = await validateParams({
          data: req.body,
          schema: request?.validation?.body,
          type: 'body',
        });
        if (request?.mapping?.body) {
          body = await mapRequestBody(request.mapping.body, parsedBody, req);
        }
      }
      let newPathName = pathname;
      for (const paramKey of endPoint.split('/')) {
        if (!paramKey.startsWith(':')) {
          continue;
        }
        const paramKeyParsed = paramKey.replace(/^:/, '');
        const paramValue = params[paramKeyParsed];
        newPathName = newPathName.replace(paramKey, paramValue);
      }
      const requestOptions: HttpClientRequestOptions = {
        method,
        headers,
      };
      if (body) {
        requestOptions.body = body;
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
      // TODO the keys will be defined by the user after the config.json refactor
      // TODO change api-bff.json to bff-config.ts
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
      const httpResponse = await httpClient.request(url, requestOptions);
      if (!httpResponse.ok) {
        if (cacheUsed) {
          return;
        }
        const error = await httpResponse.json().catch(() => null);
        throw new ErrorResponse({
          status: httpResponse.status,
          code: ErrorCodes.ProviderError,
          message: error?.message ?? error?.error ?? 'Provider internal error',
        });
      }
      let data = await httpResponse.json();
      if (response?.providerValidation) {
        const parsedResponse = await response.providerValidation.safeParseAsync(
          data
        );
        if (!parsedResponse.success) {
          throw getProviderValidationErrorResponse(
            fromZodErrorToErrorResponseObjects(parsedResponse.error, 'body')
          );
        }
        data = parsedResponse.data;
      }
      if (response?.mapping) {
        data = await mapResponseBody(response.mapping, data);
      }
      if (response?.validation) {
        const parsedResponse = await response.validation.safeParseAsync(data);
        if (!parsedResponse.success) {
          throw getProviderValidationErrorResponse(
            fromZodErrorToErrorResponseObjects(parsedResponse.error, 'body')
          );
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
      const endPointOpenapi = formatEndPoint(endPoint);
      openapiPaths[endPointOpenapi] = {
        ...openapiPaths[endPointOpenapi],
        ...meta.openapi,
      };
    }
  }
  await configureOpenapi(router, openapiPaths);
  server.use(config.prefix ?? '/', router);
  await internalConfiguration(server);
  return server.use(notFoundMiddleware()).use(errorMiddleware());
}
