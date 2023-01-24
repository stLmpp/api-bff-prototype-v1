import { getReasonPhrase, type StatusCodes } from 'http-status-codes';
import { type ResponseObject } from 'openapi3-ts';

import { ErrorResponseSchema } from '../error-response.js';

import { getContentSchemaFromZod } from './get-content-schema-from-zod.js';

const errorSchema = getContentSchemaFromZod(ErrorResponseSchema);

export function getErrorSchema(status: StatusCodes): ResponseObject {
  return {
    ...errorSchema,
    description: getReasonPhrase(status),
    content: {
      ...errorSchema.content,
      'application/json': {
        ...errorSchema.content['application/json'],
        schema: {
          ...errorSchema.content['application/json'].schema,
          properties: {
            ...errorSchema.content['application/json'].schema.properties,
            status: {
              type: 'integer',
              example: status,
            },
          },
        },
      },
    },
  };
}
