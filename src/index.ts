(globalThis as any).PROD ??= false;

import { join } from 'node:path';

import express, { Express, RequestHandler } from 'express';
import fastGlob from 'fast-glob';

import { ApiConfigSchema } from './api-config.js';
import { getConfig } from './config.js';

const EXTENSION = PROD ? 'js' : 'ts';

export async function initApiConfig(
  path: string
): Promise<[string, RequestHandler]> {
  const [, , , ...reqPath] = path
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
      // TODO refactor this to reuse code between param parsing
      if (req.method.toLowerCase() === method.toLowerCase()) {
        let newPathName = pathname;
        for (const paramKey of endPoint.split('/')) {
          if (paramKey.startsWith(':')) {
            const param = paramKey.replace(':', '');
            let paramValue = req.params[param];
            const mappingParam = mapping?.in?.params?.[param];
            if (typeof mappingParam === 'function') {
              paramValue = mappingParam(paramKey);
            } else if (mappingParam) {
              paramValue = req.params[mappingParam];
            }
            newPathName = newPathName.replace(paramKey, paramValue);
          }
        }
        const headerMapping = mapping?.in?.headers;
        const headers: Record<string, string> = {};
        if (headerMapping) {
          for (const [key, value] of Object.entries(headerMapping)) {
            if (typeof value === 'function') {
              headers[key] = value();
            } else {
              const targetKey: string = value === 'forward' ? key : value;
              const header = req.header(targetKey);
              if (header) {
                headers[key] = header;
              }
            }
          }
        }
        const bodyMapping = mapping?.in?.body;
        let body: any | undefined = undefined;
        if (bodyMapping) {
          if (typeof bodyMapping === 'function') {
            body = bodyMapping(req.body);
          } else if (typeof bodyMapping === 'object') {
            body = {};
            for (const [key, value] of Object.entries(bodyMapping)) {
              if (typeof value === 'function') {
                body[key] = value(req.body[key]);
              } else {
                body[key] = req.body[key];
              }
            }
          }
        }
        const queryParamMapping = mapping?.in?.query;
        const query: Record<string, string> = {};
        if (queryParamMapping) {
          for (const [key, value] of Object.entries(queryParamMapping)) {
            if (typeof value === 'function') {
              // TODO improve this string
              query[key] = value(String(req.query[key]));
            } else {
              const targetKey: string = value === 'forward' ? key : value;
              const queryParam = req.query[targetKey] as string;
              if (queryParam) {
                query[key] = queryParam;
              }
            }
          }
        }
        const requestOptions: RequestInit = {
          method: req.method,
          headers,
        };
        if (body) {
          requestOptions.body = JSON.stringify(body);
        }
        const urlSearchParams = new URLSearchParams(query);
        const url = new URL(newPathName, `https://${host}`);
        urlSearchParams.forEach((value, key) => {
          url.searchParams.append(key, value);
        });
        console.log(`Sending request to ${url}`);
        console.log('Request params: ', requestOptions);
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
