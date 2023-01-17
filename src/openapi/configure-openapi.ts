import { type Router } from 'express';
import { type OpenAPIObject, type PathsObject } from 'openapi3-ts';
import { serve, setup } from 'swagger-ui-express';

import { getConfig } from '../config/config.js';

export async function configureOpenapi(
  router: Router,
  paths: PathsObject
): Promise<void> {
  const config = await getConfig();
  if (!config.openapi) {
    return;
  }
  const { openapi, prefix } = config;
  const openapiObject: OpenAPIObject = {
    openapi: '3.0.2',
    paths,
    info: {
      title: openapi.title,
      version: openapi.version,
      description: openapi.description,
      contact: openapi.contact,
      termsOfService: openapi.termsOfService,
      license: openapi.license,
    },
    tags: openapi.tags,
    externalDocs: openapi.externalDocs,
    security: openapi.security,
    servers: [{ url: prefix ?? '/' }],
  };
  console.log(`Registering end-point: [GET] ${prefix ?? ''}${openapi.path}`);
  router.use(
    '/help',
    serve,
    setup(openapiObject, {
      swaggerOptions: {},
    })
  );
}
