import { getReasonPhrase, StatusCodes } from 'http-status-codes';
import { z } from 'zod';

import { ParamTypeSchema } from './param-type.js';

const ErrorResponseErrorObjectSchema = z.object({
  path: z.string(),
  message: z.string(),
  type: ParamTypeSchema,
});

const MIN_STATUS_CODE = StatusCodes.BAD_REQUEST; // 400
const MAX_STATUS_CODE = 599;

export const ErrorResponseStatusCodeSchema = z
  .number()
  .min(MIN_STATUS_CODE)
  .max(MAX_STATUS_CODE);

export const ErrorResponseSchema = z.object({
  status: ErrorResponseStatusCodeSchema,
  statusText: z.string(),
  errors: z.array(ErrorResponseErrorObjectSchema).optional(),
  error: z.string().optional(),
  code: z.string(),
  message: z.string(),
});

type ErrorResponseInterface = Omit<
  z.infer<typeof ErrorResponseSchema>,
  'statusText'
>;

export class ErrorResponse implements ErrorResponseInterface {
  constructor({
    status,
    errors,
    error,
    code,
    message,
  }: ErrorResponseInterface) {
    this.status = status;
    this.statusText = getReasonPhrase(status);
    if (errors != null) {
      this.errors = errors;
    }
    if (error != null) {
      this.error = error;
    }
    this.code = code;
    this.message = message;
  }
  status: number;
  statusText: string;
  errors?: ErrorResponseErrorObject[];
  error?: string;
  code: string;
  message: string;
}

export type ErrorResponseErrorObject = z.infer<
  typeof ErrorResponseErrorObjectSchema
>;
