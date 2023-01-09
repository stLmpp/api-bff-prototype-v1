import { Express } from 'express';
import { StatusCodes } from 'http-status-codes';

import { ErrorCodes } from './error-codes.js';
import { ErrorResponse } from './error-response.js';

export function lastConfiguration(app: Express): Express {
  return app.use((req, res) => {
    res.status(StatusCodes.NOT_FOUND).send({
      code: ErrorCodes.NotFound,
      error: 'Not found',
      message: 'The end-point was not found',
      status: StatusCodes.NOT_FOUND,
    } satisfies ErrorResponse);
  });
}
