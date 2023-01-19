import { type ZodType } from 'zod';

import { type ErrorResponseErrorObject } from './error-response.js';
import { type ParamType } from './param-type.js';
import { fromZodErrorToErrorResponseObjects } from './zod-error-formatter.js';

export async function validateParams(
  schema: ZodType,
  data: unknown,
  type: ParamType
): Promise<ErrorResponseErrorObject[]> {
  const parsedParams = await schema.safeParseAsync(data);
  if (!parsedParams.success) {
    return fromZodErrorToErrorResponseObjects(parsedParams.error, type);
  }
  return [];
}
