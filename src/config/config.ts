import { readFile } from 'node:fs/promises';
import { extname } from 'node:path';

import fastGlob from 'fast-glob';
import { parse } from 'yaml';
import { z } from 'zod';

import { ConfigCachingSchema } from './config-caching.js';
import { ConfigOpenapiSchema } from './config-openapi.js';
import { zPossibleEnv } from './env.js';

const ConfigSchema = z.object(
  {
    prefix: zPossibleEnv
      .string(z.string())
      .optional()
      .transform((prefix) => prefix?.replace(/^(?!\/)/, '/') ?? ''),
    routePath: zPossibleEnv
      .string(z.string())
      .optional()
      .default('src/app/routes'),
    caching: ConfigCachingSchema.optional(),
    openapi: ConfigOpenapiSchema.optional(),
  },
  {
    required_error: 'API BFF Config file is required',
    invalid_type_error: 'API BFF Config must be an object',
  }
);

export type Config = z.infer<typeof ConfigSchema>;

const resolvers = {
  json: (file: string) => JSON.parse(file),
  yaml: (file: string) => parse(file),
  yml: (file: string) => parse(file),
} as const;

type Extension = keyof typeof resolvers;

async function parseAndAssertConfig(
  extension: Extension,
  config: string
): Promise<Config> {
  const resolver = resolvers[extension];
  const fileParsed = resolver(config);
  const zodParsed = await ConfigSchema.safeParseAsync(fileParsed);
  if (!zodParsed.success) {
    throw new Error(
      `API BFF Config not valid.\n` +
        `Errors:\n` +
        ` - ${zodParsed.error.errors.map(
          (error) => `${error.path.join('.')} ${error.message}\n`
        )}`
    );
  }
  return zodParsed.data;
}

async function _getConfig() {
  const [configPath] = await fastGlob('api-bff.{json,yml,yaml}');
  if (!configPath) {
    throw new Error(
      'API BFF Config file not found.' +
        '\nMake sure to create one at the root of your project.' +
        '\nPossible names: api-bff.json, api-bff.yml and api-bff.yaml'
    );
  }
  try {
    const extension = extname(configPath).replace(/^\./, '') as Extension;
    const file = await readFile(configPath, { encoding: 'utf-8' });
    return parseAndAssertConfig(extension, file);
  } catch (error) {
    throw new Error(`Could not find API BFF Config.\n${error.message}`);
  }
}

let _config: Config | null = null;

export async function getConfig() {
  if (!_config) {
    _config = await _getConfig();
  }
  return _config;
}
