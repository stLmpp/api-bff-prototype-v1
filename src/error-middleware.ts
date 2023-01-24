import { type ErrorRequestHandler } from 'express';
import { StatusCodes } from 'http-status-codes';

import { ErrorCodes } from './error-codes.js';
import { ErrorResponse } from './error-response.js';

export function errorMiddleware() {
  return ((error, req, res, next) => {
    let errorResponse: ErrorResponse;
    if (error instanceof ErrorResponse) {
      errorResponse = error;
    } else {
      errorResponse = new ErrorResponse({
        code: ErrorCodes.InternalServerError,
        message: 'Internal server error', // TODO better error message
        status: StatusCodes.INTERNAL_SERVER_ERROR,
      });
    }
    res.status(errorResponse.status).send(errorResponse);
    next(errorResponse);
  }) satisfies ErrorRequestHandler;
}
