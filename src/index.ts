import express, { Express, RequestHandler } from 'express';
import fastGlob from 'fast-glob';

import { getConfig } from './config';

export async function initApiConfig(
  path: string
): Promise<[string, RequestHandler]> {
  const [, , ...reqPath] = path
    .split('/')
    .map((part) => part.replace('[', ':').replace(/]$/, ''));
  const method = reqPath.pop()!.replace(/.js$/, '');
  console.log({ path });
  const file = await import('file://' + process.cwd() + '/' + path);
  const apiConfig = file.default;
  console.log({ apiConfig });
  return [
    reqPath.join('/'),
    async (req, res, next) => {
      if (req.method.toLowerCase() === method.toLowerCase()) {
        console.log({ method });
        const response = res.send('This is not a test');
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
  for (const middleware of middlewares) {
    server.use(...middleware);
  }
  return server;
}
