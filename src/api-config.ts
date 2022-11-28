import { z } from 'zod';

const ApiConfigSchemaParam = z.record(
  z.union([
    z.literal('forward'),
    z.string(),
    z.function().args(z.string().optional()).returns(z.string()),
  ])
);

const ApiConfigSchemaMappingInOut = z.object({
  body: z
    .union([
      z.record(
        z.union([z.string(), z.function().args(z.any()).returns(z.any())])
      ),
      z.function().args(z.any()).returns(z.any()),
    ])
    .optional(),
  query: ApiConfigSchemaParam.optional(),
  params: ApiConfigSchemaParam.optional(),
  headers: z
    .record(
      z.union([
        z.literal('forward'),
        z.string(),
        z.function().args().returns(z.string()),
      ])
    )
    .optional(),
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
          body: z.any().optional(),
          query: z.record(z.string()).optional(),
          parmas: z.record(z.string()).optional(),
          headers: z.record(z.string()).optional(),
        })
        .optional(),
      response: z
        .object({
          body: z.any().optional(),
          query: z.record(z.string()).optional(),
          parmas: z.record(z.string()).optional(),
          headers: z.record(z.string()).optional(),
        })
        .optional(),
    })
    .optional(),
});

export type ApiConfig = z.infer<typeof ApiConfigSchema>;

export function env(path: string): () => string | undefined {
  return () => process.env[path];
}

export function fixed(value: any): () => string {
  return () => String(value);
}

export function forward(): 'forward' {
  return 'forward';
}
