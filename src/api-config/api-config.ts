import { type Request } from 'express';
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
  ZodObject<Record<string, ZodString | ZodOptional<ZodString>>>
> = z.any();

const ApiConfigRequestValidationOtherParams: ZodType<
  ZodObject<Record<string, ZodString | ZodOptional<ZodString>>>
> = z.any();

const ApiConfigValidationErrors = z.union([
  z.record(ErrorResponseStatusCodeSchema, ApiConfigValidationBody),
  z.object({
    default: ApiConfigValidationBody.optional(),
  }),
]);

const AnyPromiseSchema = z.union([z.any(), z.any().promise()]);

const KeySchema = z.union([z.string(), z.number(), z.symbol()]);

const ApiConfigRequestValidationMappingBodySchema = z.union([
  z.function().args(z.any(), RequestSchema).returns(AnyPromiseSchema),
  z.record(
    KeySchema,
    z.union([
      z.function().args(z.any(), RequestSchema).returns(AnyPromiseSchema),
      z.union([
        z.object({
          body: z.union([
            KeySchema,
            z.function().args(z.any()).returns(AnyPromiseSchema),
          ]),
        }),
        z.object({
          param: z.union([
            KeySchema,
            z.function().args(z.any()).returns(AnyPromiseSchema),
          ]),
        }),
        z.object({
          query: z.union([
            KeySchema,
            z.function().args(z.any()).returns(AnyPromiseSchema),
          ]),
        }),
        z.object({
          header: z.union([
            KeySchema,
            z.function().args(z.any()).returns(AnyPromiseSchema),
          ]),
        }),
      ]),
    ])
  ),
]);

const OptionalStringPromise = z.union([
  z.string().optional(),
  z.string().optional().promise(),
]);

const ApiConfigRequestMappingParams = z.union([
  z.function().args(z.any(), RequestSchema).returns(AnyPromiseSchema),
  z.record(
    KeySchema,
    z.union([
      KeySchema,
      z.union([
        z.object({
          body: z.union([
            KeySchema,
            z.function().args(z.any()).returns(OptionalStringPromise),
          ]),
        }),
        z.object({
          param: z.union([
            KeySchema,
            z.function().args(z.any()).returns(OptionalStringPromise),
          ]),
        }),
        z.object({
          query: z.union([
            KeySchema,
            z.function().args(z.any()).returns(OptionalStringPromise),
          ]),
        }),
        z.object({
          header: z.union([
            KeySchema,
            z.function().args(z.any()).returns(OptionalStringPromise),
          ]),
        }),
      ]),
    ])
  ),
]);

const ApiConfigRequestValidationMappingOtherParamsSchema = z.union([
  z.function().args(z.any(), RequestSchema),
  z.record(
    KeySchema,
    z.union([
      z.function().args(z.any(), RequestSchema).returns(OptionalStringPromise),
      KeySchema,
      z.object({
        body: z.union([
          KeySchema,
          z.function().args(z.any()).returns(OptionalStringPromise),
        ]),
      }),
      z.object({
        param: z.union([
          KeySchema,
          z.function().args(z.any()).returns(OptionalStringPromise),
        ]),
      }),
      z.object({
        query: z.union([
          KeySchema,
          z.function().args(z.any()).returns(OptionalStringPromise),
        ]),
      }),
      z.object({
        header: z.union([
          KeySchema,
          z.function().args(z.any()).returns(OptionalStringPromise),
        ]),
      }),
    ])
  ),
]);

const ApiConfigResponseMappingOkSchema = z.union([
  z.function().args(z.any()).returns(AnyPromiseSchema),
  z.record(
    KeySchema,
    z.union([KeySchema, z.function().args(z.any()).returns(AnyPromiseSchema)])
  ),
]);

const ApiConfigResponseMappingErrorsSchema = z.union([
  z.record(
    ErrorResponseStatusCodeSchema,
    z.function().args(z.any()).returns(AnyPromiseSchema)
  ),
  z.object({
    default: z.function().args(z.any()).returns(AnyPromiseSchema).optional(),
  }),
]);

const ApiConfigRequestMappingSchema = z.object({
  body: ApiConfigRequestValidationMappingBodySchema.optional(),
  params: ApiConfigRequestMappingParams.optional(),
  query: ApiConfigRequestValidationMappingOtherParamsSchema.optional(),
  headers: ApiConfigRequestValidationMappingOtherParamsSchema.optional(),
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
      validationProvider: z
        .object({
          ok: ApiConfigValidationBody.optional(),
          errors: ApiConfigValidationErrors.optional(),
        })
        .optional(),
      mapping: z
        .object({
          ok: ApiConfigResponseMappingOkSchema.optional(),
          errors: ApiConfigResponseMappingErrorsSchema.optional(),
        })
        .optional(),
      validation: z
        .object({
          ok: ApiConfigValidationBody.optional(),
          errors: ApiConfigValidationErrors.optional(),
        })
        .optional(),
    })
    .optional(),
  caching: z
    .union([ConfigCachingSchema.omit({ path: true }), z.literal(false)])
    .optional(),
  summary: z.string().optional(),
  description: z.string().optional(),
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
            | ((body: Body) => OrPromise<string | undefined>);
          param:
            | keyof Params
            | ((params: Params) => OrPromise<string | undefined>);
          query:
            | keyof Query
            | ((query: Query) => OrPromise<string | undefined>);
          header:
            | keyof Headers
            | ((headers: Headers) => OrPromise<string | undefined>);
        }>
    >;

type RequestValidationMappingParams<RouteParams, Params, Body, Query, Headers> =

    | ((params: Params, req: Request) => OrPromise<RouteParams>)
    | Record<
        keyof RouteParams,
        | keyof Params
        | RequireExactlyOne<{
            body:
              | ConditionalKeys<Body, string | undefined>
              | ((body: Body) => OrPromise<string | undefined>);
            param:
              | keyof Params
              | ((params: Params) => OrPromise<string | undefined>);
            query:
              | keyof Query
              | ((query: Query) => OrPromise<string | undefined>);
            header:
              | keyof Headers
              | ((headers: Headers) => OrPromise<string | undefined>);
          }>
      >;

type RequestValidationMappingBody<Body, Params, Query, Headers> =
  | ((body: Body, req: Request) => OrPromise<unknown>)
  | {
      [K in keyof Body]:
        | ((param: Body[K], req: Request) => OrPromise<unknown>)
        | RequireExactlyOne<{
            body: keyof Body | ((body: Body) => OrPromise<unknown>);
            param: keyof Params | ((params: Params) => OrPromise<unknown>);
            query: keyof Query | ((query: Query) => OrPromise<unknown>);
            header: keyof Headers | ((headers: Headers) => OrPromise<unknown>);
          }>;
    }
  | Record<
      string,
      RequireExactlyOne<{
        body: keyof Body | ((body: Body) => OrPromise<unknown>);
        param: keyof Params | ((params: Params) => OrPromise<unknown>);
        query: keyof Query | ((query: Query) => OrPromise<unknown>);
        header: keyof Headers | ((headers: Headers) => OrPromise<unknown>);
      }>
    >;

type ResponseMappingOk<Body, OpenapiBody> =
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
  ResponseValidationProviderOk extends ZodType,
  ResponseValidationOk extends ZodType
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
      validationProvider?: {
        ok?: ResponseValidationProviderOk;
        errors?: Partial<Record<number | 'default', ZodType>>; // TODO improve errors
      };
      mapping?: {
        ok?: ResponseMappingOk<
          z.infer<ResponseValidationProviderOk>,
          z.infer<ResponseValidationOk>
        >;
        errors?: Partial<
          Record<number | 'default', (body: unknown) => OrPromise<unknown>>
        >; // TODO improve errors
      };
      validation?: {
        ok?: ResponseValidationOk;
        errors?: Partial<Record<number, ZodType>>; // TODO improve errors
      };
    };
  }
): ApiConfig {
  return config;
}
