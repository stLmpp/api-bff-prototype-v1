import { ZodType } from 'zod';

import { ErrorResponseErrorObject } from './error-response.js';
import { ParamType } from './param-type.js';
import { fromZodErrorToErroResponseObjects } from './zod-error-formatter.js';

export async function validateParams(
  schema: ZodType,
  data: unknown,
  type: ParamType
): Promise<ErrorResponseErrorObject[]> {
  const parsedParams = await schema.safeParseAsync(data);
  if (!parsedParams.success) {
    return fromZodErrorToErroResponseObjects(parsedParams.error, type);
  }
  return [];
}
