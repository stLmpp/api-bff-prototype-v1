import { type Request } from 'express';
import { type StatusCodes } from 'http-status-codes';
import { type ConditionalKeys, type RequireExactlyOne } from 'type-fest';
import {
  z,
  type ZodObject,
  type ZodOptional,
  type ZodString,
  type ZodType,
} from 'zod';

import { ConfigCachingSchema } from '../config/config-caching.js';
import { ErrorResponseStatusCodeSchema } from '../error-response.js';
import { type OrPromise } from '../or-promise.js';

import { RequestSchema } from './request-schema.js';

const ApiConfigValidationBody: ZodType<ZodType> = z.any();

const ApiConfigRequestValidationParams: ZodType<
  ZodObject<Record<string, ZodString>>
> = z.any();

const ApiConfigRequestValidationOtherParams: ZodType<
  ZodObject<Record<string, ZodString | ZodOptional<ZodString>>>
> = z.any();

const AnyPromiseSchema = z.union([z.any(), z.any().promise()]);

const KeySchema = z.union([z.string(), z.number(), z.symbol()]);

const ApiConfigRequestMappingBodySchema = z.union([
  z.function().args(z.any(), RequestSchema).returns(AnyPromiseSchema),
  z.record(
    KeySchema,
    z.union([
      z.function().args(z.any(), RequestSchema).returns(AnyPromiseSchema),
      KeySchema,
      z.union([
        z.object({
          body: z.union([
            KeySchema,
            z.function().args(z.any(), RequestSchema).returns(AnyPromiseSchema),
          ]),
        }),
        z.object({
          param: z.union([
            KeySchema,
            z.function().args(z.any(), RequestSchema).returns(AnyPromiseSchema),
          ]),
        }),
        z.object({
          query: z.union([
            KeySchema,
            z.function().args(z.any(), RequestSchema).returns(AnyPromiseSchema),
          ]),
        }),
        z.object({
          header: z.union([
            KeySchema,
            z.function().args(z.any(), RequestSchema).returns(AnyPromiseSchema),
          ]),
        }),
      ]),
    ])
  ),
]);

export type ApiConfigRequestMappingBody = z.infer<
  typeof ApiConfigRequestMappingBodySchema
>;

const OptionalStringPromiseSchema = z.union([
  z.string().optional(),
  z.string().optional().promise(),
]);

const StringPromiseSchema = z.union([z.string(), z.string().promise()]);

const ApiConfigRequestMappingParamsSchema = z.union([
  z.function().args(z.any(), RequestSchema).returns(AnyPromiseSchema),
  z.record(
    KeySchema,
    z.union([
      KeySchema,
      z.function().args(z.any(), RequestSchema).returns(StringPromiseSchema),
      z.union([
        z.object({
          body: z.union([
            KeySchema,
            z
              .function()
              .args(z.any(), RequestSchema)
              .returns(StringPromiseSchema),
          ]),
        }),
        z.object({
          param: z.union([
            KeySchema,
            z
              .function()
              .args(z.any(), RequestSchema)
              .returns(StringPromiseSchema),
          ]),
        }),
        z.object({
          query: z.union([
            KeySchema,
            z
              .function()
              .args(z.any(), RequestSchema)
              .returns(StringPromiseSchema),
          ]),
        }),
        z.object({
          header: z.union([
            KeySchema,
            z
              .function()
              .args(z.any(), RequestSchema)
              .returns(OptionalStringPromiseSchema),
          ]),
        }),
      ]),
    ])
  ),
]);

export type ApiConfigRequestMappingParams = z.infer<
  typeof ApiConfigRequestMappingParamsSchema
>;

const ApiConfigRequestMappingOtherParamsSchema = z.union([
  z.function().args(z.any(), RequestSchema),
  z.record(
    KeySchema,
    z.union([
      z
        .function()
        .args(z.any(), RequestSchema)
        .returns(OptionalStringPromiseSchema),
      KeySchema,
      z.object({
        body: z.union([
          KeySchema,
          z
            .function()
            .args(z.any(), RequestSchema)
            .returns(OptionalStringPromiseSchema),
        ]),
      }),
      z.object({
        param: z.union([
          KeySchema,
          z
            .function()
            .args(z.any(), RequestSchema)
            .returns(OptionalStringPromiseSchema),
        ]),
      }),
      z.object({
        query: z.union([
          KeySchema,
          z
            .function()
            .args(z.any(), RequestSchema)
            .returns(OptionalStringPromiseSchema),
        ]),
      }),
      z.object({
        header: z.union([
          KeySchema,
          z
            .function()
            .args(z.any(), RequestSchema)
            .returns(OptionalStringPromiseSchema),
        ]),
      }),
    ])
  ),
]);

export type ApiConfigRequestMappingOtherParams = z.infer<
  typeof ApiConfigRequestMappingOtherParamsSchema
>;

const ApiConfigResponseMapping = z.union([
  z.function().args(z.any()).returns(AnyPromiseSchema),
  z.record(
    KeySchema,
    z.union([KeySchema, z.function().args(z.any()).returns(AnyPromiseSchema)])
  ),
]);

const ApiConfigRequestMappingSchema = z.object({
  body: ApiConfigRequestMappingBodySchema.optional(),
  params: ApiConfigRequestMappingParamsSchema.optional(),
  query: ApiConfigRequestMappingOtherParamsSchema.optional(),
  headers: ApiConfigRequestMappingOtherParamsSchema.optional(),
});

export type ApiConfigRequestMapping = z.infer<
  typeof ApiConfigRequestMappingSchema
>;

const ApiConfigRequestValidationSchema = z.object({
  body: ApiConfigValidationBody.optional(),
  params: ApiConfigRequestValidationParams.optional(),
  query: ApiConfigRequestValidationOtherParams.optional(),
  headers: ApiConfigRequestValidationOtherParams.optional(),
});

export type ApiConfigRequestValidation = z.infer<
  typeof ApiConfigRequestValidationSchema
>;

export const ApiConfigSchema = z.object({
  host: z.string(),
  path: z.string(),
  request: z
    .object({
      validation: ApiConfigRequestValidationSchema.optional(),
      mapping: ApiConfigRequestMappingSchema.optional(),
    })
    .optional(),
  response: z
    .object({
      providerValidation: ApiConfigValidationBody.optional().optional(),
      mapping: ApiConfigResponseMapping.optional(),
      validation: ApiConfigValidationBody.optional().optional(),
      possibleErrors: z.array(ErrorResponseStatusCodeSchema).optional(),
    })
    .optional(),
  caching: z
    .union([ConfigCachingSchema.omit({ path: true }), z.literal(false)])
    .optional(),
  summary: z.string().optional(),
  description: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

export type ApiConfig = z.infer<typeof ApiConfigSchema>;

type IsParameter<Part> = Part extends `:${infer ParamName}` ? ParamName : never;
type FilteredParts<Path> = Path extends `${infer PartA}/${infer PartB}`
  ? IsParameter<PartA> | FilteredParts<PartB>
  : IsParameter<Path>;
type RouteParameters<Path> = {
  [Key in FilteredParts<Path>]: string;
};

type RequestValidationMappingOtherParams<T, Body, Params, Query, Headers> =
  | ((params: T, req: Request) => OrPromise<Record<string, string | undefined>>)
  | Record<
      string,
      | keyof T
      | ((params: T, req: Request) => OrPromise<string | undefined>)
      | RequireExactlyOne<{
          body:
            | ConditionalKeys<Body, string | undefined>
            | ((body: Body, req: Request) => OrPromise<string | undefined>);
          param:
            | keyof Params
            | ((params: Params, req: Request) => OrPromise<string | undefined>);
          query:
            | keyof Query
            | ((query: Query, req: Request) => OrPromise<string | undefined>);
          header:
            | keyof Headers
            | ((
                headers: Headers,
                req: Request
              ) => OrPromise<string | undefined>);
        }>
    >;

type RequestValidationMappingParams<RouteParams, Params, Body, Query, Headers> =

    | ((params: Params, req: Request) => OrPromise<RouteParams>)
    | Record<
        keyof RouteParams,
        | keyof Params
        | ((params: Params, req: Request) => OrPromise<string>)
        | RequireExactlyOne<{
            body:
              | ConditionalKeys<Body, string>
              | ((body: Body, req: Request) => OrPromise<string>);
            param:
              | keyof Params
              | ((params: Params, req: Request) => OrPromise<string>);
            query:
              | keyof Query
              | ((query: Query, req: Request) => OrPromise<string>);
            header:
              | keyof Headers
              | ((headers: Headers, req: Request) => OrPromise<string>);
          }>
      >;

type RequestValidationMappingBody<Body, Params, Query, Headers> =
  | ((body: Body, req: Request) => OrPromise<unknown>)
  | Record<
      string,
      | keyof Body
      | ((body: Body, req: Request) => OrPromise<unknown>)
      | RequireExactlyOne<{
          body: keyof Body | ((body: Body, req: Request) => OrPromise<unknown>);
          param:
            | keyof Params
            | ((params: Params, req: Request) => OrPromise<unknown>);
          query:
            | keyof Query
            | ((query: Query, req: Request) => OrPromise<unknown>);
          header:
            | keyof Headers
            | ((headers: Headers, req: Request) => OrPromise<unknown>);
        }>
    >;

type ResponseMapping<Body, OpenapiBody> =
  | ((body: Body) => OpenapiBody)
  | {
      [K in keyof OpenapiBody]:
        | ConditionalKeys<Body, OpenapiBody[K]>
        | ((body: Body) => OpenapiBody[K]);
    };

export function apiConfig<
  Route extends string,
  RequestValidationBody extends ZodType,
  RequestValidationParams extends ZodObject<Record<string, ZodString>>,
  RequestValidationQuery extends ZodObject<
    Record<string, ZodString | ZodOptional<ZodString>>
  >,
  RequestValidationHeaders extends ZodObject<
    Record<string, ZodString | ZodOptional<ZodString>>
  >,
  ResponseProviderValidation extends ZodType,
  ResponseValidation extends ZodType
>(
  config: Omit<ApiConfig, 'path' | 'request' | 'response'> & {
    path: Route;
    request?: {
      validation?: {
        body?: RequestValidationBody;
        params?: RequestValidationParams;
        query?: RequestValidationQuery;
        headers?: RequestValidationHeaders;
      };
      mapping?: {
        body?: RequestValidationMappingBody<
          z.infer<RequestValidationBody>,
          z.infer<RequestValidationParams>,
          z.infer<RequestValidationQuery>,
          z.infer<RequestValidationHeaders>
        >;
        params?: RequestValidationMappingParams<
          RouteParameters<Route>,
          z.infer<RequestValidationParams>,
          z.infer<RequestValidationBody>,
          z.infer<RequestValidationQuery>,
          z.infer<RequestValidationHeaders>
        >;
        query?: RequestValidationMappingOtherParams<
          z.infer<RequestValidationQuery>,
          z.infer<RequestValidationBody>,
          z.infer<RequestValidationParams>,
          z.infer<RequestValidationQuery>,
          z.infer<RequestValidationHeaders>
        >;
        headers?: RequestValidationMappingOtherParams<
          z.infer<RequestValidationHeaders>,
          z.infer<RequestValidationBody>,
          z.infer<RequestValidationParams>,
          z.infer<RequestValidationQuery>,
          z.infer<RequestValidationHeaders>
        >;
      };
    };
    response?: {
      providerValidation?: ResponseProviderValidation;
      mapping?: ResponseMapping<
        z.infer<ResponseProviderValidation>,
        z.infer<ResponseValidation>
      >;
      validation?: ResponseValidation;
      possibleErrors?: StatusCodes[];
    };
  }
): ApiConfig {
  return config;
}
