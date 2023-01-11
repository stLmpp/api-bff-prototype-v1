import { z } from 'zod';

import { RequestSchema } from './request-schema.js';

const ApiConfigMappingParamReturnSchema = z.union([
  z.record(z.string(), z.union([z.string(), z.undefined()])),
  z.promise(z.record(z.string(), z.union([z.string(), z.undefined()]))),
]);

const ApiConfigMappingParamSpecificReturnSchema = z.union([
  z.unknown(),
  z.promise(z.unknown()),
]);

const ApiConfigMappingParamFunctionSchema = z
  .function()
  .args(z.record(z.string()), RequestSchema)
  .returns(ApiConfigMappingParamReturnSchema);

const ApiConfigMappingParamSpecificFunctionSchema = z
  .function()
  .args(z.union([z.string(), z.undefined()]), RequestSchema)
  .returns(ApiConfigMappingParamSpecificReturnSchema);

const ApiConfigMappingParamObjectSchema = z.record(
  z.string(),
  z.union([z.string(), ApiConfigMappingParamSpecificFunctionSchema])
);

export const ApiConfigMappingParamSchema = z.union([
  ApiConfigMappingParamFunctionSchema,
  ApiConfigMappingParamObjectSchema,
]);

export type ApiConfigMappingParam = z.infer<typeof ApiConfigMappingParamSchema>;
export type ApiConfigMappingParamObject = z.infer<
  typeof ApiConfigMappingParamObjectSchema
>;
