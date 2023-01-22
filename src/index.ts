import { join } from 'node:path';

import compression from 'compression';
import express, {
  type Express,
  json,
  type RequestHandler,
  type Response,
  Router,
} from 'express';
import fastGlob from 'fast-glob';
import helmet from 'helmet';
import { getReasonPhrase, StatusCodes } from 'http-status-codes';
import { type PathItemObject, type PathsObject } from 'openapi3-ts';
import { type z, type ZodType } from 'zod';

import { ApiConfigSchema } from './api-config/api-config.js';
import { getCachingStrategy } from './caching/caching-resolver.js';
import {
  type ConfigCaching,
  ConfigCachingPathSchema,
} from './config/config-caching.js';
import { getConfig } from './config/config.js';
import { ErrorCodes } from './error-codes.js';
import { type ErrorResponse } from './error-response.js';
import { getHttpClient } from './http-client/get-http-client.js';
import { type HttpClientRequestOptions } from './http-client/http-client.js';
import { methodHasBody } from './http-client/method-has-body.js';
import { internalConfiguration } from './internal-configuration.js';
import { formatHeaders } from './map-headers-in.js';
import { formatQuery } from './map-query-in.js';
import { MethodSchema } from './method.js';
import { notFoundMiddleware } from './not-found-middleware.js';
import { configureOpenapi } from './openapi/configure-openapi.js';
import { getOperation } from './openapi/get-operation.js';
import { type ParamType } from './param-type.js';
import { fromZodErrorToErrorResponseObjects } from './zod-error-formatter.js';

const EXTENSION = 'js';
const DIST = 'dist';
const ROUTES = `${DIST}/routes`;

interface InitApiConfigResultMeta {
  method: string;
  openapi?: PathItemObject | null;
}
type InitApiConfigResult = [string, RequestHandler, InitApiConfigResultMeta];
async function validateAndSendBadRequest<T, Z extends ZodType>({
  res,
  type,
  schema,
  data,
}: {
  data: T;
  schema?: Z;
  type: ParamType;
  res: Response;
}): Promise<T | z.infer<Z> | null> {
  if (!schema) {
    return data;
  }
  const parsedData = await schema.safeParseAsync(data);
  if (!parsedData.success) {
    res.status(StatusCodes.BAD_REQUEST).send({
      status: StatusCodes.BAD_REQUEST,
      errors: fromZodErrorToErrorResponseObjects(parsedData.error, type),
      error: getReasonPhrase(StatusCodes.BAD_REQUEST),
      message: 'Invalid parameters', // TODO better error message
      code: ErrorCodes.BadRequest,
    } satisfies ErrorResponse);
    return null;
  }
  return parsedData.data;
}

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
    caching,
    request,
    response,
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
      const params = await validateAndSendBadRequest({
        res,
        data: req.params,
        schema: request?.validation?.params,
        type: 'params',
      });
      if (!params) {
        return;
      }
      if (request?.mapping?.params) {
        // TODO map params
      }
      const formattedQuery = formatQuery(req.query);
      const parsedQuery = await validateAndSendBadRequest({
        res,
        data: formattedQuery,
        type: 'query',
        schema: request?.validation?.query,
      });
      if (!parsedQuery) {
        return;
      }
      const query = formatQuery(parsedQuery);
      if (request?.mapping?.query) {
        // TODO map query
      }
      const formattedHeaders = formatHeaders(req.headers);
      const parsedHeaders = await validateAndSendBadRequest({
        res,
        data: formattedHeaders,
        type: 'headers',
        schema: request?.validation?.headers,
      });
      if (!parsedHeaders) {
        return;
      }
      const headers = formatHeaders(parsedHeaders);
      if (request?.mapping?.headers) {
        // TODO map headers
      }
      let body: unknown | null = null;
      if (methodHasBody(method)) {
        body = validateAndSendBadRequest({
          res,
          data: req.body,
          schema: request?.validation?.body,
          type: 'body',
        });
        if (req.body && !body) {
          return;
        }
        if (request?.mapping?.body) {
          // TODO map body
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
        requestOptions.body;
      }
      const urlSearchParams = new URLSearchParams(query);
      const url = new URL(newPathName, `https://${host}`);
      console.log(`Sending request to ${url}`);
      urlSearchParams.forEach((value, key) => {
        url.searchParams.append(key, value);
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
      const httpResponse = await httpClient.request(url, requestOptions);
      if (!httpResponse.ok) {
        if (cacheUsed) {
          return;
        }
        let errorResponse =
          (await httpResponse.json().catch(() => null)) ??
          (await httpResponse.text());
        const validationProviderError =
          response?.validationProvider?.errors?.[httpResponse.status] ??
          response?.validationProvider?.errors?.default;
        if (validationProviderError) {
          // TODO validate provider error
        }
        const mappingOutError =
          response?.mapping?.errors?.[httpResponse.status] ??
          response?.mapping?.errors?.default;
        if (mappingOutError) {
          errorResponse = mappingOutError(errorResponse);
        }
        const validationError =
          response?.validation?.errors?.[httpResponse.status] ??
          response?.validation?.errors?.default;
        if (validationError) {
          // TODO validate error
        }
        res.status(httpResponse.status).send(errorResponse);
        return;
      }
      let data = await httpResponse.json();
      if (response?.validationProvider?.ok) {
        const parsedResponse =
          await response.validationProvider.ok.safeParseAsync(data);
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
      if (response?.mapping?.ok) {
        // TODO mapping body out
      }
      if (response?.validation?.ok) {
        const parsedResponse = await response.validation.ok.safeParseAsync(
          data
        );
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
    // async (req, res, next) => {
    //   if (req.method.toLowerCase() !== method.toLowerCase()) {
    //     next();
    //     return;
    //   }
    //   const [params, headers, body, query] = await Promise.all([
    //     mapParamsIn(mapping?.in?.params, req),
    //     mapHeadersIn(mapping?.in?.headers, req),
    //     method === 'GET'
    //       ? Promise.resolve(undefined)
    //       : mapBodyIn(mapping?.in?.body, req),
    //     mapQueryIn(mapping?.in?.query, req),
    //   ]);
    //   let newPathName = pathname;
    //   const badRequestErrors: ErrorResponseErrorObject[] = [];
    //   const headerSchema = openapi?.request?.headers;
    //   if (headerSchema) {
    //     const errors = await validateParams(headerSchema, headers, 'headers');
    //     badRequestErrors.push(...errors);
    //   }
    //   const querySchema = openapi?.request?.query;
    //   if (querySchema) {
    //     const errors = await validateParams(querySchema, query, 'query');
    //     badRequestErrors.push(...errors);
    //   }
    //   const paramsSchema = openapi?.request?.params;
    //   if (paramsSchema) {
    //     const errors = await validateParams(paramsSchema, params, 'params');
    //     badRequestErrors.push(...errors);
    //   }
    //   for (const paramKey of endPoint.split('/')) {
    //     if (!paramKey.startsWith(':')) {
    //       continue;
    //     }
    //     const paramKeyParsed = paramKey.replace(/^:/, '');
    //     const paramValue = params[paramKeyParsed];
    //     if (paramValue == null) {
    //       badRequestErrors.push({
    //         path: paramKeyParsed,
    //         message: `${paramKeyParsed} is required`,
    //         type: 'params',
    //       });
    //     }
    //     newPathName = newPathName.replace(paramKey, paramValue);
    //   }
    //   const requestOptions: HttpClientRequestOptions = {
    //     method,
    //     headers,
    //   };
    //   const bodyZodSchema = openapi?.request?.body;
    //   if (bodyZodSchema) {
    //     const errors = await validateParams(bodyZodSchema, body, 'body');
    //     badRequestErrors.push(...errors);
    //   }
    //   if (body) {
    //     requestOptions.body = JSON.stringify(body);
    //   }
    //   if (badRequestErrors.length) {
    //     const errorResponse = {
    //       status: StatusCodes.BAD_REQUEST,
    //       errors: badRequestErrors,
    //       error: getReasonPhrase(StatusCodes.BAD_REQUEST),
    //       message: 'Invalid parameters', // TODO better error message
    //       code: ErrorCodes.BadRequest,
    //     } satisfies ErrorResponse;
    //     res.status(StatusCodes.BAD_REQUEST).send(errorResponse);
    //     return;
    //   }
    //   const urlSearchParams = new URLSearchParams(query);
    //   const url = new URL(newPathName, `https://${host}`);
    //   console.log(`Sending request to ${url}`);
    //   urlSearchParams.forEach((value, key) => {
    //     url.searchParams.append(key, value);
    //   });
    //   console.log('Request params: ', {
    //     ...requestOptions,
    //     query,
    //     params,
    //   });
    //   const hasCachingConfig =
    //     caching !== false && (!!globalConfig.caching || !!caching);
    //   const shouldCache = method === 'GET' && hasCachingConfig;
    //   const newCaching = (
    //     hasCachingConfig
    //       ? {
    //           type: caching?.type ?? globalConfig.caching?.type ?? 'memory',
    //           path: ConfigCachingPathSchema.parse(globalConfig.caching?.path),
    //           ttl: caching?.ttl ?? globalConfig.caching?.ttl,
    //         }
    //       : { type: 'memory', path: '' }
    //   ) satisfies ConfigCaching;
    //   let cacheUsed = false;
    //   // TODO define what will compose the cache key
    //   const cacheKey = `${url.toString()};;;;meta=${JSON.stringify({
    //     authorization: headers.authorization,
    //   })}`;
    //   const cachingStrategy = getCachingStrategy(newCaching.type!);
    //   if (shouldCache) {
    //     const cachedValue = await cachingStrategy
    //       .get(cacheKey, newCaching)
    //       .catch(() => null);
    //     if (cachedValue != null) {
    //       console.log('Using cached value');
    //       res.status(StatusCodes.OK).send(cachedValue);
    //       cacheUsed = true;
    //     }
    //   }
    //   const httpClient = await getHttpClient();
    //   const response = await httpClient.request(url, requestOptions);
    //   if (!response.ok) {
    //     if (cacheUsed) {
    //       return;
    //     }
    //     let errorResponse =
    //       (await response.json().catch(() => null)) ?? (await response.text());
    //     const mappingOutError =
    //       mapping?.out?.errors?.[response.status] ??
    //       mapping?.out?.errors?.default;
    //     if (mappingOutError) {
    //       errorResponse = await mapBodyOut(mappingOutError, errorResponse);
    //     }
    //     res.status(response.status).send(errorResponse);
    //     return;
    //   }
    //   let data = await response.json();
    //   if (mapping?.out?.ok) {
    //     data = await mapBodyOut(mapping.out.ok, data);
    //   }
    //   console.log(res.header);
    //   if (openapi?.response?.ok) {
    //     const parsedResponse = await openapi.response.ok.safeParseAsync(data);
    //     if (!parsedResponse.success) {
    //       const error: ErrorResponse = {
    //         error: getReasonPhrase(StatusCodes.MISDIRECTED_REQUEST),
    //         status: StatusCodes.MISDIRECTED_REQUEST,
    //         message: 'The response from the server has data validation errors',
    //         errors: fromZodErrorToErrorResponseObjects(
    //           parsedResponse.error,
    //           'body'
    //         ),
    //         code: ErrorCodes.ResponseValidationError,
    //       };
    //       res.status(StatusCodes.MISDIRECTED_REQUEST).send(error);
    //       return;
    //     }
    //     data = parsedResponse.data;
    //   }
    //   if (shouldCache) {
    //     cachingStrategy.set(cacheKey, data, newCaching).catch(() => null);
    //     console.log('New value cached');
    //   }
    //   if (cacheUsed) {
    //     return;
    //   }
    //   res.status(StatusCodes.OK).send(data);
    // },
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
