import { z, type ZodType } from 'zod';

import { MethodSchema } from '../method.js';

const URLSChema: ZodType<URL> = z.any();

const ConfigCachingTypeSchema = z.union([
  z.literal('memory'),
  z.literal('persistent'),
]);
export type ConfigCachingType = z.infer<typeof ConfigCachingTypeSchema>;
export const CONFIG_CACHING_PATH_DEFAULT = '__caching';
export const ConfigCachingPathSchema = z
  .string()
  .optional()
  .default(CONFIG_CACHING_PATH_DEFAULT);
export const ConfigCachingSchema = z.object({
  type: ConfigCachingTypeSchema,
  path: z.string().optional().default(CONFIG_CACHING_PATH_DEFAULT),
  ttl: z.number().optional(),
  keyComposer: z
    .function()
    .args(
      z.object({
        url: URLSChema,
        query: z.record(z.string()),
        params: z.record(z.string()),
        headers: z.record(z.string()),
        body: z.unknown().optional(),
        method: MethodSchema,
      })
    )
    .returns(z.string())
    .optional()
    .default(({ url, method }) => `${method}__${url}`),
});
export type ConfigCaching = z.infer<typeof ConfigCachingSchema>;
