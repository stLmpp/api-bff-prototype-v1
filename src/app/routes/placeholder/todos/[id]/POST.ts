import { extendApi } from '@anatine/zod-openapi';
import { StatusCodes } from 'http-status-codes';
import { z } from 'zod';

import { ApiConfig } from '../../../../../api-config/api-config.js';
import { forward } from '../../../../../api-config/forward.js';

const MIN_ARRAY = 1;

export default {
  host: 'jsonplaceholder.typicode.com',
  path: 'todos/:id',
  mapping: {
    in: {
      params: {
        id: forward(),
      },
      body: forward(),
    },
  },
  openapi: {
    request: {
      body: z.object({
        id: z.string(),
        auth: z.string(),
        other: z.number(),
        object: z.object({
          id: z.string(),
        }),
        array: z
          .array(
            z.object({
              id: z.string(),
            })
          )
          .min(MIN_ARRAY),
      }),
      params: z.object({
        id: z.string(),
      }),
      query: z.object({
        test: extendApi(z.string(), { description: 'Test query' }),
      }),
      headers: z.object({
        authorization: z.string().optional(),
      }),
    },
    response: {
      ok: z.object({
        id: z.string(),
      }),
      errors: [
        {
          statusCode: StatusCodes.BAD_REQUEST,
          body: z.object({}),
        },
        {
          statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
          body: z.object({}),
        },
      ],
    },
  },
} satisfies ApiConfig;
