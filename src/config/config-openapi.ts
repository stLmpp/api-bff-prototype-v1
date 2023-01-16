import { z } from 'zod';

import { zPossibleEnv } from './env.js';

export const DEFAULT_OPENAPI_VALUES = {
  path: '/help',
  title: 'Api BFF',
  version: '1',
} as const;

const ConfigOpenapiObjectExternalDocsSchema = z.object({
  url: zPossibleEnv.string(z.string().url()),
  description: zPossibleEnv.string(z.string()),
});

// TODO update config.schema.json
export const ConfigOpenapiObjectSchema = z.object({
  path: zPossibleEnv
    .string(z.string())
    .optional()
    .default(DEFAULT_OPENAPI_VALUES.path)
    .transform((path) => path?.replace(/^(?!\/)/, '/')),
  title: zPossibleEnv
    .string(z.string())
    .optional()
    .default(DEFAULT_OPENAPI_VALUES.title),
  version: z
    .union([
      zPossibleEnv.string(z.string()),
      zPossibleEnv.number(z.number()).transform((item) => String(item)),
    ])
    .optional()
    .default(DEFAULT_OPENAPI_VALUES.version),
  description: zPossibleEnv.string(z.string()).optional(),
  contact: z
    .object({
      url: zPossibleEnv.string(z.string()).optional(),
      name: zPossibleEnv.string(z.string()).optional(),
      email: zPossibleEnv.string(z.string().email()).optional(),
    })
    .optional(),
  termsOfService: zPossibleEnv.string(z.string()).optional(),
  license: z.object({
    name: zPossibleEnv.string(z.string()),
    url: zPossibleEnv.string(z.string()).optional(),
  }),
  tags: z
    .array(
      z.object({
        name: zPossibleEnv.string(z.string()),
        description: zPossibleEnv.string(z.string()).optional(),
        externalDocs: ConfigOpenapiObjectExternalDocsSchema.optional(),
      })
    )
    .optional(),
  externalDocs: ConfigOpenapiObjectExternalDocsSchema.optional(),
  security: z.array(z.record(z.string(), z.array(z.string()))).optional(),
});

export const ConfigOpenapiSchema = z.union([
  zPossibleEnv
    .boolean(z.boolean())
    .transform(
      (openapi) => openapi && (DEFAULT_OPENAPI_VALUES as ConfigOpenapiObject)
    ),
  ConfigOpenapiObjectSchema,
]);

export type ConfigOpenapiObject = z.infer<typeof ConfigOpenapiObjectSchema>;
