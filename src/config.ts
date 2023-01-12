import { readFile } from 'node:fs/promises';
import { extname } from 'node:path';

import fastGlob from 'fast-glob';
import { parse } from 'yaml';
import { z, ZodType } from 'zod';

const ConfigCachingTypeSchema = z.union([
  z.literal('memory'),
  z.literal('persistent'),
]);

export type ConfigCachingType = z.infer<typeof ConfigCachingTypeSchema>;

export const ConfigCachingPathSchema = z
  .string()
  .optional()
  .default('__caching');

export const ConfigCachingSchema = z.object({
  type: ConfigCachingTypeSchema,
  path: ConfigCachingPathSchema,
  ttl: z.number().optional(),
});

export type ConfigCaching = z.infer<typeof ConfigCachingSchema>;

const START_STRING = 'ENV.';
const EnvStringSchema = z
  .string()
  .startsWith(START_STRING)
  .transform((env) => _getEnv(env));

// TODO add mapping to convert boolean and numeric values

const mapper = {
  number: (item: string | undefined) => item && Number(item),
} as const;

function _zPossibleEnv<T extends ZodType>(
  schema: T,
  type: 'number' | 'boolean' | 'string' = 'string'
) {
  return z.union([schema, EnvStringSchema]);
}

function _getEnv(env: string) {
  return process.env[env.replace(new RegExp(`^${START_STRING}`), '')];
}

const ConfigSchema = z.object({
  prefix: _zPossibleEnv(z.string())
    .optional()
    .transform((prefix) => prefix?.replace(/^(?!\/)/, '/') ?? ''),
  routePath: _zPossibleEnv(z.string()).optional().default('src/app/routes'),
  caching: ConfigCachingSchema.optional(),
  openapi: _zPossibleEnv(z.boolean()).optional(),
});

export type Config = z.infer<typeof ConfigSchema>;

let _config: Config | null = null;

const resolvers = {
  json: (file: string) => JSON.parse(file),
  yaml: (file: string) => parse(file),
  yml: (file: string) => parse(file),
} as const;

async function parseAndAssertConfig(
  extension: keyof typeof resolvers,
  config: string
): Promise<Config> {
  const resolver = resolvers[extension];
  const fileParsed = resolver(config);
  const zodParsed = await ConfigSchema.safeParseAsync(fileParsed);
  if (!zodParsed.success) {
    // TODO improve error message
    throw new Error('Config not valid');
  }
  return zodParsed.data;
}

async function _getConfig(): Promise<Config> {
  const [configPath] = await fastGlob('api-bff.{json,yml,yaml}');
  if (!configPath) {
    throw new Error(
      'API BFF Config file not found.' +
        '\nMake sure to create one at the root of your project.' +
        '\nPossible names: api-bff.json, api-bff.yml and api-bff.yaml'
    );
  }
  try {
    const extension = extname(configPath).replace(
      /^\./,
      ''
    ) as keyof typeof resolvers;
    const file = await readFile(configPath, { encoding: 'utf-8' });
    return parseAndAssertConfig(extension, file);
  } catch (error) {
    throw new Error(`Could not find API BFF Config.\n${error.message}`);
  }
}

export async function getConfig(): Promise<Config> {
  if (!_config) {
    _config = await _getConfig();
  }
  return _config;
}
