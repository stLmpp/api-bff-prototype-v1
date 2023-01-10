import { Request } from 'express';
import { z, ZodObject, ZodType } from 'zod';

import { ConfigCachingSchema } from './config.js';
import { ErrorResponseStatusCodeSchema } from './error-response.js';
import { ParamType } from './param-type.js';

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

const ApiConfigSchemaMappingIn = z.object({
  body: ApiConfigSchemaMappingBody.optional(),
  query: ApiConfigSchemaMappingParam.optional(),
  params: ApiConfigSchemaMappingParam.optional(),
  headers: ApiConfigSchemaMappingParam.optional(),
});

const ApiConfigSchemaMappingOut = z.object({
  body: ApiConfigSchemaMappingBody.optional(),
  headers: ApiConfigSchemaMappingParam.optional(),
});

const ApiConfigSchemaMapping = z.object({
  in: ApiConfigSchemaMappingIn.optional(),
  on: ApiConfigSchemaMappingOut.optional(),
});

const ApiConfigSchemaOpenapiParams: ZodType<ZodObject<any>> = z.any();
const ApiConfigSchemaOpenapiBody: ZodType<ZodType> = z.any();

const ApiConfigSchemaOpenapiRequest = z.object({
  body: ApiConfigSchemaOpenapiBody.optional(),
  query: ApiConfigSchemaOpenapiParams.optional(),
  params: ApiConfigSchemaOpenapiParams.optional(),
  headers: ApiConfigSchemaOpenapiParams.optional(),
});

const ApiConfigSchemaOpenapi = z.object({
  summary: z.string().optional(),
  description: z.string().optional(),
  request: ApiConfigSchemaOpenapiRequest.optional(),
  response: z
    .object({
      ok: ApiConfigSchemaOpenapiParams.optional(),
      errors: z
        .array(
          z.object({
            statusCode: ErrorResponseStatusCodeSchema,
            body: ApiConfigSchemaOpenapiParams.optional(),
          })
        )
        .optional(),
    })
    .optional(),
});

export const ApiConfigSchema = z.object({
  host: z.string(),
  path: z.string(),
  mapping: ApiConfigSchemaMapping.optional(),
  openapi: ApiConfigSchemaOpenapi.optional(),
  caching: z
    .union([ConfigCachingSchema.omit({ path: true }), z.literal(false)])
    .optional(),
});

export type ApiConfig = z.infer<typeof ApiConfigSchema>;
export type ApiConfigMapping = z.infer<typeof ApiConfigSchemaMapping>;
export type ApiConfigMappingIn = z.infer<typeof ApiConfigSchemaMappingIn>;
export type ApiConfigMappingOut = z.infer<typeof ApiConfigSchemaMappingOut>;
export type ApiConfigOpenapiRequest = z.infer<
  typeof ApiConfigSchemaOpenapiRequest
>;

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
  type: Exclude<ParamType, 'body'>,
  param: string | ((params: Record<string, string>) => string | undefined)
): (_: any, req: Request) => string | undefined {
  const resolver =
    typeof param === 'function'
      ? param
      : (params: Record<string, string>) => params[param];
  // TODO check as any
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
