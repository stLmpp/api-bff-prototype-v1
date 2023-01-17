import { z, type ZodType } from 'zod';

const START_STRING = 'ENV.' as const;
const START_STRING_REGEX = new RegExp(`^${START_STRING.replace('.', '\\.')}`);
const EnvStringSchema = z
  .string()
  .startsWith(START_STRING)
  .transform((env) => _getEnv(env));
export const zPossibleEnv = {
  string: <T extends ZodType>(schema: T) =>
    z.union([schema, EnvStringSchema.pipe(schema)]),
  number: <T extends ZodType>(schema: T) =>
    z.union([
      schema,
      EnvStringSchema.transform((env) => (env ? Number(env) : undefined)).pipe(
        schema
      ),
    ]),
  boolean: <T extends ZodType>(schema: T) =>
    z.union([
      schema,
      EnvStringSchema.transform((env) => env === 'true').pipe(schema),
    ]),
} as const;

function _getEnv(env: string) {
  return process.env[env.replace(START_STRING_REGEX, '')];
}
