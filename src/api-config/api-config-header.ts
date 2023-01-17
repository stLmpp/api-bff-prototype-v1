import { type IncomingHttpHeaders } from 'http';

import { z, type ZodType } from 'zod';

import { RequestSchema } from './request-schema.js';

const IncominingHttpHeadersTypesSchema = z.union([
  z.string(),
  z.undefined(),
  z.array(z.string()),
]);
const IncomingHttpHeadersSchema: ZodType<IncomingHttpHeaders> = z.record(
  z.string(),
  IncominingHttpHeadersTypesSchema
);

const ApiConfigMappingHeadersReturnSchema = z.union([
  IncomingHttpHeadersSchema,
  z.promise(IncomingHttpHeadersSchema),
]);

const ApiConfigMappingHeadersSpecificReturnSchema = z.union([
  z.unknown(),
  z.promise(z.unknown()),
]);

const ApiConfigMappingHeaderSpecificFunctionSchema = z
  .function()
  .args(IncominingHttpHeadersTypesSchema, RequestSchema)
  .returns(ApiConfigMappingHeadersSpecificReturnSchema);

const ApiConfigMappingHeadersFunctionSchema = z
  .function()
  .args(IncomingHttpHeadersSchema, RequestSchema)
  .returns(ApiConfigMappingHeadersReturnSchema);

const ApiConfigMappingHeadersObjectSchema = z.record(
  z.string(),
  z.union([z.string(), ApiConfigMappingHeaderSpecificFunctionSchema])
);

export const ApiConfigMappingHeadersSchema = z.union([
  ApiConfigMappingHeadersFunctionSchema,
  ApiConfigMappingHeadersObjectSchema,
]);

export type ApiConfigMappingHeadersSpecificReturn = z.infer<
  typeof ApiConfigMappingHeadersSpecificReturnSchema
>;
export type ApiConfigMappingHeadersSpecificFunction = z.infer<
  typeof ApiConfigMappingHeaderSpecificFunctionSchema
>;
export type ApiConfigMappingHeaders = z.infer<
  typeof ApiConfigMappingHeadersSchema
>;
export type ApiConfigMappingHeadersObject = z.infer<
  typeof ApiConfigMappingHeadersObjectSchema
>;
