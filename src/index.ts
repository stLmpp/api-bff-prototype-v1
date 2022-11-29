import { join } from 'node:path';

import express, { Express, RequestHandler } from 'express';
import fastGlob from 'fast-glob';

import { ApiConfigSchema } from './api-config.js';
import { getConfig } from './config.js';
import { mapParams } from './map-params.js';

(globalThis as any).PROD ??= false;

const EXTENSION = PROD ? 'js' : 'ts';

export async function initApiConfig(
  path: string
): Promise<[string, RequestHandler]> {
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
  const { host, path: pathname, mapping } = parsedApiConfig.data;
  const endPoint = `/${reqPath.join('/')}`;
  return [
    endPoint,
    async (req, res, next) => {
      if (req.method.toLowerCase() === method.toLowerCase()) {
        const [params, headers, body, query] = await Promise.all([
          mapParams('params', mapping?.in?.params, req),
          mapParams('headers', mapping?.in?.headers, req),
          req.method.toLowerCase() === 'get'
            ? Promise.resolve()
            : mapParams('body', mapping?.in?.body, req),
          mapParams('query', mapping?.in?.query, req),
        ]);
        let newPathName = pathname;
        if (params) {
          for (const paramKey of endPoint.split('/')) {
            if (!paramKey.startsWith(':')) {
              continue;
            }
            const paramKey2 = paramKey.replace(/^:/, '');
            const paramValue = params[paramKey2];
            newPathName = newPathName.replace(paramKey, paramValue);
          }
        }
        const requestOptions: RequestInit = {
          method: req.method,
          headers,
        };
        console.log({ body });
        if (body) {
          requestOptions.body = JSON.stringify(body);
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
        const response = await fetch(url, requestOptions);
        const data = await response.json();
        res.status(200).send(data);
      } else {
        next();
      }
    },
  ];
}

export async function initApp(): Promise<Express> {
  const server = express();
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
  for (const [endPoint, handler] of middlewaresSorted) {
    console.log(`Registering end-point: ${endPoint}`);
    server.use(endPoint, handler);
  }
  return server;
}
