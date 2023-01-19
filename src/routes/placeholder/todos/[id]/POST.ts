import { StatusCodes } from 'http-status-codes';
import { z } from 'zod';

import { type ApiConfig } from '../../../../api-config/api-config.js';
import { forward } from '../../../../api-config/forward.js';
import { schema } from '../../../../openapi/schema.js';

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
    description: 'POST TODOS',
    summary: 'POST TODOS SUMMARY',
    request: {
      body: schema(
        z.object({
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
        { description: 'Body' }
      ),
      params: z.object({
        id: z.string(),
      }),
      query: z.object({
        test: schema(z.string(), { description: 'Test query' }),
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
