import { Request } from 'express';
import { z } from 'zod';

import { ConfigCachingSchema } from './config';

const ZRequest: z.ZodType<Request> = z.any();

const ApiConfigSchemaMappingParam = z.union([
  z
    .function()
    .args(z.record(z.string()), ZRequest)
    .returns(z.union([z.record(z.string()), z.promise(z.record(z.string()))])),
  z.record(
    z.union([
      z.string(),
      z
        .function()
        .args(z.string().optional(), ZRequest)
        .returns(z.union([z.any().optional(), z.promise(z.any().optional())])),
    ])
  ),
]);

export type ApiConfigSchemaMappingParam = z.infer<
  typeof ApiConfigSchemaMappingParam
>;

const ApiConfigSchemaMappingBody = z.union([
  z
    .function()
    .args(z.any().optional(), ZRequest)
    .returns(z.union([z.any(), z.promise(z.any())])),
  z.record(
    z.union([
      z.string(),
      z
        .function()
        .args(z.any().optional(), ZRequest)
        .returns(z.union([z.any().optional(), z.promise(z.any().optional())])),
    ])
  ),
]);

export type ApiConfigSchemaMappingBody = z.infer<
  typeof ApiConfigSchemaMappingBody
>;

const ApiConfigSchemaMappingInOut = z.object({
  body: ApiConfigSchemaMappingBody.optional(),
  query: ApiConfigSchemaMappingParam.optional(),
  params: ApiConfigSchemaMappingParam.optional(),
  headers: ApiConfigSchemaMappingParam.optional(),
});

const ApiConfigSchemaOpenapiSafeParseUnion = z.discriminatedUnion('success', [
  z.object({
    success: z.literal(true),
    data: z.any(),
  }),
  z.object({
    success: z.literal(false),
    error: z.any(),
  }),
]);
const ApiConfigSchemaOpenapiParams = z.object({
  safeParse: z
    .function()
    .args(z.any(), z.any().optional())
    .returns(ApiConfigSchemaOpenapiSafeParseUnion),
  safeParseAsync: z
    .function()
    .args(z.any(), z.any().optional())
    .returns(z.promise(ApiConfigSchemaOpenapiSafeParseUnion)),
});

export const ApiConfigSchema = z.object({
  host: z.string(),
  path: z.string(),
  mapping: z
    .object({
      in: ApiConfigSchemaMappingInOut.optional(),
      on: ApiConfigSchemaMappingInOut.optional(),
    })
    .optional(),
  openapi: z
    .object({
      summary: z.string().optional(),
      description: z.string().optional(),
      request: z
        .object({
          body: ApiConfigSchemaOpenapiParams.optional(),
          query: ApiConfigSchemaOpenapiParams.optional(),
          params: ApiConfigSchemaOpenapiParams.optional(),
          headers: ApiConfigSchemaOpenapiParams.optional(),
        })
        .optional(),
      response: z
        .object({
          body: ApiConfigSchemaOpenapiParams.optional(),
          query: ApiConfigSchemaOpenapiParams.optional(),
          params: ApiConfigSchemaOpenapiParams.optional(),
          headers: ApiConfigSchemaOpenapiParams.optional(),
        })
        .optional(),
    })
    .optional(),
  caching: z.union([ConfigCachingSchema, z.literal(false)]).optional(),
});

export type ApiConfig = z.infer<typeof ApiConfigSchema>;

export function env(path: string): () => string | undefined {
  return () => process.env[path];
}

export function fixed(value: any): () => any {
  return () => value;
}

export function forward(): (value: any) => any {
  return (value) => value;
}

export function fromBody(
  param: string | ((body: any) => any)
): (_: any, req: Request) => any {
  const resolver =
    typeof param === 'function' ? param : (body: any) => body[param];
  return (_, req) => resolver(req.body);
}

function _fromParam(
  type: 'params' | 'query' | 'headers',
  param: string | ((params: Record<string, string>) => string | undefined)
): (_: any, req: Request) => string | undefined {
  const resolver =
    typeof param === 'function'
      ? param
      : (params: Record<string, string>) => params[param];
  return (_, req) => resolver(req[type] as any);
}

export function fromParam(
  param: string | ((params: Record<string, string>) => string | undefined)
): (_: any, req: Request) => string | undefined {
  return _fromParam('params', param);
}

export function fromQuery(
  param: string | ((params: Record<string, string>) => string | undefined)
): (_: any, req: Request) => string | undefined {
  return _fromParam('query', param);
}

export function fromHeader(
  param: string | ((params: Record<string, string>) => string | undefined)
): (_: any, req: Request) => string | undefined {
  return _fromParam('headers', param);
}
