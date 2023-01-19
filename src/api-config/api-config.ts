import { z, type ZodObject, type ZodType } from 'zod';

import { ConfigCachingSchema } from '../config/config-caching.js';
import { ErrorResponseStatusCodeSchema } from '../error-response.js';

import { ApiConfigMappingBodySchema } from './api-config-body.js';
import { ApiConfigMappingHeadersSchema } from './api-config-header.js';
import { ApiConfigMappingParamSchema } from './api-config-param.js';
import { ApiConfigMappingQuerySchema } from './api-config-query.js';

const ApiConfigMappingInSchema = z.object({
  body: ApiConfigMappingBodySchema.optional(),
  query: ApiConfigMappingQuerySchema.optional(),
  params: ApiConfigMappingParamSchema.optional(),
  headers: ApiConfigMappingHeadersSchema.optional(),
});

const ApiConfigMappingOutResponseReturnSchema = z.union([
  z.unknown(),
  z.promise(z.unknown()),
]);
const ApiConfigMappingOutResponseFunctionSchema = z
  .function()
  .args(z.unknown())
  .returns(ApiConfigMappingOutResponseReturnSchema);

export const ApiConfigMappingOutResponseSchema = z.union([
  ApiConfigMappingOutResponseFunctionSchema,
  z.record(
    z.string(),
    z.union([z.string(), ApiConfigMappingOutResponseFunctionSchema])
  ),
]);

export type ApiConfigMappingOutResponse = z.infer<
  typeof ApiConfigMappingOutResponseSchema
>;

const ApiConfigMappingOutSchema = z.object({
  ok: ApiConfigMappingOutResponseSchema.optional(),
  errors: z
    .record(
      z.union([ErrorResponseStatusCodeSchema, z.literal('default')]),
      ApiConfigMappingOutResponseSchema
    )
    .optional(),
});

const ApiConfigMappingSchema = z.object({
  in: ApiConfigMappingInSchema.optional(),
  out: ApiConfigMappingOutSchema.optional(),
});

const ApiConfigOpenapiParamsSchema: ZodType<
  ZodObject<Record<string, ZodType>>
> = z.any();
const ApiConfigOpenapiBodySchema: ZodType<ZodType> = z.any();

const ApiConfigOpenapiRequestSchema = z.object({
  body: ApiConfigOpenapiBodySchema.optional(),
  query: ApiConfigOpenapiParamsSchema.optional(),
  params: ApiConfigOpenapiParamsSchema.optional(),
  headers: ApiConfigOpenapiParamsSchema.optional(),
});

const ApiConfigOpenapiSchema = z.object({
  summary: z.string().optional(),
  description: z.string().optional(),
  request: ApiConfigOpenapiRequestSchema.optional(),
  response: z
    .object({
      ok: ApiConfigOpenapiBodySchema.optional(),
      errors: z
        .array(
          z.object({
            statusCode: ErrorResponseStatusCodeSchema,
            body: ApiConfigOpenapiBodySchema.optional(),
          })
        )
        .optional(),
    })
    .optional(),
});

export const ApiConfigSchema = z.object({
  host: z.string(),
  path: z.string(),
  mapping: ApiConfigMappingSchema.optional(),
  openapi: ApiConfigOpenapiSchema.optional(),
  caching: z
    .union([ConfigCachingSchema.omit({ path: true }), z.literal(false)])
    .optional(),
});

export type ApiConfig = z.infer<typeof ApiConfigSchema>;
export type ApiConfigMapping = z.infer<typeof ApiConfigMappingSchema>;
export type ApiConfigMappingIn = z.infer<typeof ApiConfigMappingInSchema>;
export type ApiConfigMappingOut = z.infer<typeof ApiConfigMappingOutSchema>;
export type ApiConfigOpenapiRequest = z.infer<
  typeof ApiConfigOpenapiRequestSchema
>;
