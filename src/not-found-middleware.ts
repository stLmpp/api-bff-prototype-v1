import { type RequestHandler } from 'express';
import { getReasonPhrase, StatusCodes } from 'http-status-codes';

import { ErrorCodes } from './error-codes.js';
import { type ErrorResponse } from './error-response.js';

export function notFoundMiddleware(): RequestHandler {
  return (req, res) => {
    res.status(StatusCodes.NOT_FOUND).send({
      code: ErrorCodes.NotFound,
      error: getReasonPhrase(StatusCodes.NOT_FOUND),
      message: 'The end-point was not found',
      status: StatusCodes.NOT_FOUND,
    } satisfies ErrorResponse);
  };
}
