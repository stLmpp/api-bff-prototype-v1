import { z } from 'zod';

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
});
export type ConfigCaching = z.infer<typeof ConfigCachingSchema>;
