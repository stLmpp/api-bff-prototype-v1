import { z, type ZodObject, ZodString, type ZodType } from 'zod';

import { ConfigCachingSchema } from '../config/config-caching.js';
import { ErrorResponseStatusCodeSchema } from '../error-response.js';

import { ApiConfigMappingBodySchema } from './api-config-body.js';
import { ApiConfigMappingHeadersSchema } from './api-config-header.js';
import { ApiConfigMappingParamSchema } from './api-config-param.js';
import { ApiConfigMappingQuerySchema } from './api-config-query.js';
import { ApiConfigValidationSchema } from './api-config-validation.js';
import express, { Request } from 'express';
import { ConditionalKeys, RequireExactlyOne } from 'type-fest';

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
  validation: ApiConfigValidationSchema.optional(),
});

export type ApiConfig = z.infer<typeof ApiConfigSchema>;
export type ApiConfigMapping = z.infer<typeof ApiConfigMappingSchema>;
export type ApiConfigMappingIn = z.infer<typeof ApiConfigMappingInSchema>;
export type ApiConfigMappingOut = z.infer<typeof ApiConfigMappingOutSchema>;
export type ApiConfigOpenapiRequest = z.infer<
  typeof ApiConfigOpenapiRequestSchema
>;

type IsParameter<Part> = Part extends `:${infer ParamName}` ? ParamName : never;
type FilteredParts<Path> = Path extends `${infer PartA}/${infer PartB}`
  ? IsParameter<PartA> | FilteredParts<PartB>
  : IsParameter<Path>;
type RouteParameters<Path> = {
  [Key in FilteredParts<Path>]: string;
};

type ValidationInOtherParamsType<T, Body, Params, Query, Headers> =
  | ((params: T, req: Request) => Record<string, string | undefined>)
  | {
      [K in keyof T]:
        | ((param: T[K], req: Request) => string | undefined)
        | RequireExactlyOne<{
            body:
              | ConditionalKeys<Body, string | undefined>
              | ((body: Body) => string | undefined);
            param: keyof Body | ((params: Params) => string | undefined);
            query: keyof Query | ((query: Query) => string | undefined);
            header: keyof Headers | ((headers: Headers) => string | undefined);
          }>;
    }
  | Record<
      string,
      RequireExactlyOne<{
        body:
          | ConditionalKeys<Body, string | undefined>
          | ((body: Body) => string | undefined);
        param: keyof Body | ((params: Params) => string | undefined);
        query: keyof Query | ((query: Query) => string | undefined);
        header: keyof Headers | ((headers: Headers) => string | undefined);
      }>
    >;

type ValidationInParamsType<RouteParams, Params, Body, Query, Headers> =
  | ((params: Params, req: Request) => RouteParams)
  | Required<
      Record<
        keyof RouteParams,
        | keyof Params
        | RequireExactlyOne<{
            body:
              | ConditionalKeys<Body, string | undefined>
              | ((body: Body) => string | undefined);
            param: keyof Params | ((params: Params) => string | undefined);
            query: keyof Query | ((query: Query) => string | undefined);
            header: keyof Headers | ((headers: Headers) => string | undefined);
          }>
      >
    >;

type ValidationInBodyType<Body, Params, Query, Headers> =
  | ((body: Body, req: Request) => unknown)
  | {
      [K in keyof Body]:
        | ((param: Body[K], req: Request) => unknown)
        | RequireExactlyOne<{
            body: keyof Body | ((body: Body) => unknown);
            param: keyof Params | ((params: Params) => unknown);
            query: keyof Query | ((query: Query) => unknown);
            header: keyof Headers | ((headers: Headers) => unknown);
          }>;
    }
  | Record<
      string,
      RequireExactlyOne<{
        body: keyof Body | ((body: Body) => unknown);
        param: keyof Params | ((params: Params) => unknown);
        query: keyof Query | ((query: Query) => unknown);
        header: keyof Headers | ((headers: Headers) => unknown);
      }>
    >;

export function apiConfig<
  Route extends string,
  ValidationInBody extends ZodType,
  ValidationInParams extends ZodObject<Record<string, ZodString>>,
  ValidationInQuery extends ZodObject<Record<string, ZodString>>,
  ValidationInHeaders extends ZodObject<Record<string, ZodString>>,
  ValidationOutOk extends ZodType,
  OpenapiOutOk extends ZodType,
  RouteParams extends Record<string, string> = RouteParameters<Route>
>(
  config: Omit<ApiConfig, 'path' | 'mapping' | 'validation' | 'openapi'> & {
    path: Route;
    validation?: {
      in?: {
        body?: ValidationInBody;
        params?: ValidationInParams;
        query?: ValidationInQuery;
        headers?: ValidationInHeaders;
      };
      out?: {
        ok?: ValidationOutOk;
        errors?: Record<number | 'default', ZodType>;
      };
    };
  } & {
    openapi?: { out?: { ok?: OpenapiOutOk } };
  } & {
    mapping?: {
      in?: {
        body?: ValidationInBodyType<
          z.infer<ValidationInBody>,
          z.infer<ValidationInParams>,
          z.infer<ValidationInQuery>,
          z.infer<ValidationInHeaders>
        >;
        params?: ValidationInParamsType<
          RouteParams,
          z.infer<ValidationInParams>,
          z.infer<ValidationInBody>,
          z.infer<ValidationInQuery>,
          z.infer<ValidationInHeaders>
        >;
        query?: ValidationInOtherParamsType<
          z.infer<ValidationInQuery>,
          z.infer<ValidationInBody>,
          z.infer<ValidationInParams>,
          z.infer<ValidationInQuery>,
          z.infer<ValidationInHeaders>
        >;
        headers?: ValidationInOtherParamsType<
          z.infer<ValidationInHeaders>,
          z.infer<ValidationInBody>,
          z.infer<ValidationInParams>,
          z.infer<ValidationInQuery>,
          z.infer<ValidationInHeaders>
        >;
      };
      out?: {
        ok?: (body: z.infer<ValidationOutOk>) => z.infer<OpenapiOutOk>;
        errors?: Record<number | 'default', (body: unknown) => unknown>;
      };
    };
  }
) {
  return config;
}

apiConfig({
  path: 'todos/:id/:id2',
  host: 'jsonplaceholder.typicode.com',
  validation: {
    in: {
      body: z.object({
        id: z.string(),
        value: z.string(),
      }),
      params: z.object({
        id: z.string(),
      }),
    },
  },
  mapping: {
    in: {
      body: {
        id2: { body: 'id' },
      },
      params: (params) => ({
        id2: params.id,
        id: '',
      }),
    },
  },
});

express().get('/:id', (req) => {
  req.params.id;
});
