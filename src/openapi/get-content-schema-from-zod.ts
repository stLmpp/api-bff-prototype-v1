import { type SchemaObject } from 'openapi3-ts';
import { type ZodType } from 'zod';

import { getSchemaFromZod } from './get-schema-from-zod.js';

export function getContentSchemaFromZod(zodSchema: ZodType): {
  content: { 'application/json': { schema: SchemaObject } };
} {
  return {
    content: {
      'application/json': {
        schema: getSchemaFromZod(zodSchema),
      },
    },
  };
}
