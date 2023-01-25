import { z } from 'zod';

import { fromZodErrorToErrorResponseObjects } from '../zod-error-formatter.js';

import { ConfigCachingSchema } from './config-caching.js';
import { ConfigOpenapiSchema } from './config-openapi.js';
import { zPossibleEnv } from './env.js';

const ConfigSchema = z.object(
  {
    prefix: zPossibleEnv
      .string(z.string())
      .optional()
      .transform((prefix) => prefix?.replace(/^(?!\/)/, '/') ?? ''),
    caching: ConfigCachingSchema.optional(),
    openapi: ConfigOpenapiSchema.optional(),
    httpClient: zPossibleEnv
      .string(z.union([z.literal('got'), z.literal('axios')]))
      .optional()
      .default('got'),
  },
  {
    required_error: 'API BFF Config file is required',
    invalid_type_error: 'API BFF Config must be an object',
  }
);

export type ConfigInput = z.input<typeof ConfigSchema>;
export type Config = z.infer<typeof ConfigSchema>;

async function parseAndAssertConfig(config: unknown): Promise<Config> {
  const zodParsed = await ConfigSchema.safeParseAsync(config);
  if (!zodParsed.success) {
    const errors = fromZodErrorToErrorResponseObjects(zodParsed.error, 'body');
    throw new Error(
      `API BFF Config not valid.\n` +
        `Errors:\n` +
        `${errors
          .map((error) => `- "${error.path}" ${error.message}`)
          .join('\n')}`
    );
  }
  return zodParsed.data;
}

async function _getConfig() {
  const filename = new URL('../api-bff.config.js', import.meta.url);
  try {
    const file = await import(filename.toString());
    if (!file.default) {
      throw new Error(
        'API BFF Config does not have a default export.\n' +
          'Please follow the template below\n\n' +
          `import { defineConfig } from 'api-bff';\n\n` +
          'export default defineConfig({}); // Your config here\n\n'
      );
    }
    return parseAndAssertConfig(file.default);
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

export function defineConfig(config: ConfigInput) {
  return config;
}
