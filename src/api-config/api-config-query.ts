import { type ParsedQs } from 'qs';
import { z, type ZodType } from 'zod';

import { RequestSchema } from './request-schema.js';

const ParsedQsSchema: ZodType<ParsedQs> = z.lazy(() =>
  z.record(z.string(), ParsedQsTypesSchema)
);
const ParsedQsTypesSchema = z.lazy(() =>
  z.union([
    z.undefined(),
    z.string(),
    z.array(z.string()),
    ParsedQsSchema,
    z.array(ParsedQsSchema),
  ])
);

const ApiConfigMappingQueryReturnSchema = z.union([
  z.record(z.string(), z.unknown()),
  z.promise(z.record(z.string(), z.unknown())),
]);

export const ApiConfigMappingQuerySpecificReturnSchema = z.union([
  z.unknown(),
  z.promise(z.unknown()),
]);

export const ApiConfigMappingQuerySpecificFunctionSchema = z
  .function()
  .args(ParsedQsTypesSchema, RequestSchema)
  .returns(ApiConfigMappingQuerySpecificReturnSchema);

const ApiConfigMappingQueryFunctionSchema = z
  .function()
  .args(ParsedQsSchema, RequestSchema)
  .returns(ApiConfigMappingQueryReturnSchema);

const ApiConfigMappingQueryObjectSchema = z.record(
  z.string(),
  z.union([z.string(), ApiConfigMappingQuerySpecificFunctionSchema])
);

export const ApiConfigMappingQuerySchema = z.union([
  ApiConfigMappingQueryFunctionSchema,
  ApiConfigMappingQueryObjectSchema,
]);

export type ApiConfigMappingQuerySpecificFunction = z.infer<
  typeof ApiConfigMappingQuerySpecificFunctionSchema
>;
export type ApiConfigMappingQuerySpecificReturn = z.infer<
  typeof ApiConfigMappingQuerySpecificReturnSchema
>;
export type ApiConfigMappingQuery = z.infer<typeof ApiConfigMappingQuerySchema>;
export type ApiConfigMappingQueryObject = z.infer<
  typeof ApiConfigMappingQueryObjectSchema
>;
