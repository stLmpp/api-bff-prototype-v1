import { generateSchema } from '@anatine/zod-openapi';
import { SchemaObject } from 'openapi3-ts';
import { ZodType } from 'zod';

export function getSchemaFromZod(zodSchema: ZodType): SchemaObject {
  return generateSchema(zodSchema);
}
