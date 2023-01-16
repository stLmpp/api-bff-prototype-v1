import { z } from 'zod';

import { zPossibleEnv } from './env.js';

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
  type: zPossibleEnv.string(ConfigCachingTypeSchema),
  path: zPossibleEnv
    .string(z.string())
    .optional()
    .default(CONFIG_CACHING_PATH_DEFAULT),
  ttl: zPossibleEnv.number(z.number()).optional(),
});
export type ConfigCaching = z.infer<typeof ConfigCachingSchema>;
