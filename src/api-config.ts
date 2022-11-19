import { z } from 'zod';

const ApiConfigSchemaParam = z.union([
  z.record(z.union([z.string(), z.function()])),
  z.function(),
]);

const ApiConfigSchemaMappingInOut = z.object({
  body: ApiConfigSchemaParam.optional(),
  query: ApiConfigSchemaParam.optional(),
  params: ApiConfigSchemaParam.optional(),
  headers: ApiConfigSchemaParam.optional(),
});

const ApiConfigSchema = z.object({
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
