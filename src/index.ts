import { join } from 'node:path';

import express, { Express, RequestHandler } from 'express';
import fastGlob from 'fast-glob';

import { ApiConfigSchema } from './api-config.js';
import { getConfig } from './config.js';

export async function initApiConfig(
  path: string
): Promise<[string, RequestHandler]> {
  const [, , , ...reqPath] = path
    .split('/')
    .map((part) => part.replace('[', ':').replace(/]$/, ''));
  const method = reqPath.pop()!.replace(/.js$/, '');
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
        let newPathName = pathname;
        for (const p of endPoint.split('/')) {
          if (p.startsWith(':')) {
            const param = p.replace(':', '');
            let paramValue = req.params[param];
            const mappingParam = mapping?.in?.params?.[param];
            if (typeof mappingParam === 'function') {
              paramValue = mappingParam(p);
            } else if (mappingParam) {
              paramValue = req.params[mappingParam];
            }
            newPathName = newPathName.replace(p, paramValue);
          }
        }
        const headersMapping = mapping?.in?.headers;
        const headers: Record<string, string> = {};
        if (headersMapping) {
          for (const [key, value] of Object.entries(headersMapping)) {
            if (typeof value === 'function') {
              headers[key] = value();
            } else {
              const header = req.header(value === 'forward' ? key : value);
              if (header) {
                headers[key] = header;
              }
            }
          }
        }
        const url = new URL(newPathName, `https://${host}`);
        const response = await fetch(url, { method: req.method, headers });
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
  const globPath = `dist/${config.routePath}/**/{GET,POST,PUT,PATCH,DELETE}.js`;
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
