import { Express } from 'express';
import { OpenAPIObject, PathsObject } from 'openapi3-ts';
import { serve, setup } from 'swagger-ui-express';

export function configureOpenapi(app: Express, paths: PathsObject): Express {
  // TODO add title, etc from configuration
  const openapiObject: OpenAPIObject = {
    openapi: '3.0.2',
    paths,
    info: { title: 'Api BFF', version: '1' },
  };
  return app.use('/api/help', serve, setup(openapiObject));
}
