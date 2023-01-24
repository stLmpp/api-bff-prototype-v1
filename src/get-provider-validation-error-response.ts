import { StatusCodes } from 'http-status-codes';

import { ErrorCodes } from './error-codes.js';
import {
  ErrorResponse,
  type ErrorResponseErrorObject,
} from './error-response.js';

export function getProviderValidationErrorResponse(
  errors: ErrorResponseErrorObject[]
) {
  return new ErrorResponse({
    status: StatusCodes.MISDIRECTED_REQUEST,
    message: 'The response from the server has data validation errors',
    errors,
    code: ErrorCodes.ResponseValidationError,
  });
}
