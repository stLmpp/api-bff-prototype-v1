import { StatusCodes } from 'http-status-codes';
import { type z, type ZodType } from 'zod';

import { ErrorCodes } from './error-codes.js';
import { ErrorResponse } from './error-response.js';
import { type ParamType } from './param-type.js';
import { fromZodErrorToErrorResponseObjects } from './zod-error-formatter.js';

interface ValidateParamsArgs<T, Z extends ZodType> {
  data: T;
  schema?: Z;
  type: ParamType;
}

export async function validateParams<T, Z extends ZodType>({
  type,
  schema,
  data,
}: ValidateParamsArgs<T, Z>): Promise<T | z.infer<Z>> {
  if (!schema) {
    return data;
  }
  const parsedData = await schema.safeParseAsync(data);
  if (!parsedData.success) {
    throw new ErrorResponse({
      status: StatusCodes.BAD_REQUEST,
      errors: fromZodErrorToErrorResponseObjects(parsedData.error, type),
      message: `Invalid input on ${type}`,
      code: ErrorCodes.BadRequest,
    });
  }
  return parsedData.data;
}
