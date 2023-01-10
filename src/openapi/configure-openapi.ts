import { Router } from 'express';
import { OpenAPIObject, PathsObject } from 'openapi3-ts';
import { serve, setup } from 'swagger-ui-express';

import { getConfig } from '../config.js';

export async function configureOpenapi(
  router: Router,
  paths: PathsObject
): Promise<void> {
  // TODO add title, etc from configuration
  const config = await getConfig();
  const openapiObject: OpenAPIObject = {
    openapi: '3.0.2',
    paths,
    info: { title: 'Api BFF', version: '1' },
    servers: [{ url: config.prefix ?? '/' }],
  };
  router.use(
    '/help',
    serve,
    setup(openapiObject, {
      swaggerOptions: {},
    })
  );
}
