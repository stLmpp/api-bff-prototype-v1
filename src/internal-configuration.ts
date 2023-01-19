import { type Express } from 'express';
import { StatusCodes } from 'http-status-codes';

import { getAllCachingStrategies } from './caching/caching-resolver.js';
import { getConfig } from './config/config.js';

export async function internalConfiguration(app: Express): Promise<Express> {
  const config = await getConfig();
  if (!config.caching) {
    return app;
  }
  const caching = config.caching;
  const cachingStrategies = getAllCachingStrategies();
  const endPoint = '/__bff-internal/invalidade-all-cache';
  console.log(`Registering end-point: [POST] ${endPoint}`);
  return app.post(endPoint, async (req, res) => {
    await Promise.all(
      cachingStrategies.map((cachingStrategy) =>
        cachingStrategy.invalidateAll({
          ttl: 0,
          type: cachingStrategy.type(),
          path: caching.path,
        })
      )
    );
    res.status(StatusCodes.OK).send();
  });
}
