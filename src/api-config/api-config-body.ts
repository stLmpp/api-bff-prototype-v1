import { z } from 'zod';

import { RequestSchema } from './request-schema.js';

const ApiConfigMappingBodyReturnSchema = z.union([
  z.unknown(),
  z.promise(z.unknown()),
]);

const ApiConfigMappingBodyFunctionSchema = z
  .function()
  .args(z.unknown(), RequestSchema)
  .returns(ApiConfigMappingBodyReturnSchema);

const ApiConfigMappingBodyObjectSchema = z.record(
  z.string(),
  z.union([z.string(), ApiConfigMappingBodyFunctionSchema])
);

export const ApiConfigMappingBodySchema = z.union([
  ApiConfigMappingBodyFunctionSchema,
  z.record(
    z.string(),
    z.union([z.string(), ApiConfigMappingBodyFunctionSchema])
  ),
]);

export type ApiConfigMappingBody = z.infer<typeof ApiConfigMappingBodySchema>;
export type ApiConfigMappingBodyObject = z.infer<
  typeof ApiConfigMappingBodyObjectSchema
>;
