import { StatusCodes } from 'http-status-codes';
import { z } from 'zod';

import { ParamTypeSchema } from './param-type.js';

const ErrorResponseErrorObjectSchema = z.object({
  path: z.string(),
  message: z.string(),
  type: ParamTypeSchema,
});

const MIN_STATUS_CODE = StatusCodes.BAD_REQUEST; // 400
const MAX_STATUS_CODE = 599;

export const ErrorResponseSchema = z.object({
  status: z.number().min(MIN_STATUS_CODE).max(MAX_STATUS_CODE),
  errors: z.array(ErrorResponseErrorObjectSchema).optional(),
  error: z.string().optional(),
  code: z.string(),
  message: z.string(),
});

export type ErrorResponse = z.infer<typeof ErrorResponseSchema>;
export type ErrorResponseErrorObject = z.infer<
  typeof ErrorResponseErrorObjectSchema
>;
