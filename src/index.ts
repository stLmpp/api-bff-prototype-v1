import { join } from 'node:path';

import compression from 'compression';
import express, { Express, json, RequestHandler } from 'express';
import fastGlob from 'fast-glob';
import helmet from 'helmet';
import { SafeParseReturnType, ZodSchema } from 'zod';

import { ApiConfigSchema } from './api-config.js';
import { CachingResolver } from './caching/caching-resolver';
import { ConfigCaching, getConfig } from './config.js';
import { ErrorResponse, ErrorResponseErrorObject } from './error-response';
import { mapParams } from './map-params.js';
import { validateParams } from './validate-params';

(globalThis as any).PROD ??= false;

const EXTENSION = PROD ? 'js' : 'ts';

export async function initApiConfig(
  path: string
): Promise<[string, RequestHandler, { method: string }]> {
  const [, , ...reqPath] = path
    .split('/')
    .map((part) => part.replace('[', ':').replace(/]$/, ''));
  const method = reqPath.pop()!.replace(new RegExp(`\\.${EXTENSION}$`), '');
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
  const endPoint = `/${reqPath.join('/')}`;
  return [
    endPoint,
    async (req, res, next) => {
      const reqMethod = req.method.toLowerCase();
      if (reqMethod !== method.toLowerCase()) {
        next();
        return;
      }
      const [params, headers, body, query] = await Promise.all([
        mapParams('params', mapping?.in?.params, req),
        mapParams('headers', mapping?.in?.headers, req),
        reqMethod === 'get'
          ? Promise.resolve(undefined)
          : mapParams('body', mapping?.in?.body, req),
        mapParams('query', mapping?.in?.query, req),
      ]);
      let newPathName = pathname;
      const badRequestErrors: ErrorResponseErrorObject[] = [];
      const headerSchema = openapi?.request?.headers as ZodSchema | undefined;
      if (headerSchema) {
        const errors = await validateParams(headerSchema, headers, 'headers');
        badRequestErrors.push(...errors);
      }
      const querySchema = openapi?.request?.query as ZodSchema | undefined;
      if (querySchema) {
        const errors = await validateParams(querySchema, query, 'query');
        badRequestErrors.push(...errors);
      }
      const paramsSchema = openapi?.request?.params as ZodSchema | undefined;
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
      const requestOptions: RequestInit = {
        method: req.method,
        headers,
      };
      const bodyZodSchema = openapi?.request?.body;
      if (bodyZodSchema) {
        const parsedBody = (await bodyZodSchema.safeParseAsync(
          body,
          undefined
        )) as SafeParseReturnType<any, any>;
        if (!parsedBody.success) {
          const messages = parsedBody.error.errors.map((error) => ({
            path: error.path.join('.'),
            message: error.message,
            type: 'body',
          })) satisfies ErrorResponseErrorObject[];
          badRequestErrors.push(...messages);
        }
      }
      if (body) {
        requestOptions.body = JSON.stringify(body);
      }
      if (badRequestErrors.length) {
        const errorResponse = {
          status: 400,
          errors: badRequestErrors,
          message: 'Bad request',
          code: '400',
        } satisfies ErrorResponse;
        res.status(400).send(errorResponse);
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
      const globalConfig = await getConfig();
      const hasCachingConfig =
        caching !== false && (!!globalConfig.caching || !!caching);
      const shouldCache = method.toLowerCase() === 'get' && hasCachingConfig;
      const newCaching = (
        hasCachingConfig
          ? {
              type: caching?.type ?? globalConfig.caching?.type ?? 'memory',
              path: caching?.path ?? globalConfig.caching?.path ?? '__caching',
              ttl: caching?.ttl ?? globalConfig.caching?.ttl,
            }
          : { type: 'memory', path: '' }
      ) satisfies ConfigCaching;
      let cacheUsed = false;
      const cacheKey = `${url.toString()};;;;meta=${JSON.stringify({
        authorization: headers.authorization,
      })}`;
      const cachingStrategy = CachingResolver.getCachingStrategy(
        newCaching.type!
      );
      if (shouldCache) {
        const cachedValue = await cachingStrategy
          .get(cacheKey, newCaching)
          .catch(() => null);
        if (cachedValue != null) {
          console.log('Using cached value');
          res.status(200).send(cachedValue);
          cacheUsed = true;
        }
      }
      // TODO use a library to fetch data
      const response = await fetch(url, requestOptions);
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
      const data = await response.json();
      if (shouldCache) {
        cachingStrategy.set(cacheKey, data, newCaching).catch(() => null);
        console.log('New value cached');
      }
      if (cacheUsed) {
        return;
      }
      res.status(200).send(data);
    },
    { method },
  ];
}

export async function initApp(): Promise<Express> {
  const server = express().use(helmet()).use(compression()).use(json());
  const config = await getConfig();
  const beginning = PROD ? 'dist/' : '';
  const middleGlob = '/**/{GET,POST,PUT,PATCH,DELETE}';
  const globPath = `${beginning}${config.routePath}${middleGlob}.${EXTENSION}`;
  const paths = await fastGlob(globPath);
  const middlewares = await Promise.all(
    paths.map((path) => initApiConfig(path))
  );
  const middlewaresSorted = [...middlewares].sort(
    ([endPointA], [endPointB]) => endPointB.length - endPointA.length
  );
  for (const [endPoint, handler, meta] of middlewaresSorted) {
    console.log(
      `Registering end-point: [${meta.method.toUpperCase()}] ${endPoint}`
    );
    server.use(endPoint, handler);
  }
  return server;
}
