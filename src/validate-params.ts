import { SafeParseReturnType, ZodSchema } from 'zod';

import { ErrorResponseErrorObject } from './error-response.js';
import { ParamType } from './param-type.js';

export async function validateParams(
  headerZodSchema: ZodSchema,
  params: Record<string, string>,
  type: ParamType
): Promise<ErrorResponseErrorObject[]> {
  const parsedParams = (await headerZodSchema.safeParseAsync(
    params,
    undefined
  )) as SafeParseReturnType<any, any>;
  if (!parsedParams.success) {
    return parsedParams.error.errors.map((error) => ({
      path: error.path.join('.'),
      message: error.message,
      type,
    })) satisfies ErrorResponseErrorObject[];
  }
  return [];
}
