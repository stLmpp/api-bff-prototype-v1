import { type RequestHandler } from 'express';
import { StatusCodes } from 'http-status-codes';

import { ErrorCodes } from './error-codes.js';
import { ErrorResponse } from './error-response.js';

export function notFoundMiddleware() {
  return ((_, __, next) => {
    next(
      new ErrorResponse({
        code: ErrorCodes.NotFound,
        message: 'The end-point was not found',
        status: StatusCodes.NOT_FOUND,
      })
    );
  }) satisfies RequestHandler;
}
