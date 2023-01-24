import { StatusCodes } from 'http-status-codes';
import { z } from 'zod';

import { apiConfig } from '../../../../api-config/api-config.js';
import { forward } from '../../../../api-config/forward.js';
import { schema } from '../../../../openapi/schema.js';

const MIN_ARRAY = 1;

export default apiConfig({
  host: 'jsonplaceholder.typicode.com',
  path: 'todos/:id',
  summary: 'POST TODOS SUMMARY',
  description: 'POST TODOS',
  request: {
    validation: {
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
    mapping: {
      params: {
        id: 'id',
      },
      body: forward(),
    },
  },
  response: {
    validation: z.object({
      id: z.string(),
    }),
    possibleErrors: [
      StatusCodes.BAD_GATEWAY,
      StatusCodes.INTERNAL_SERVER_ERROR,
    ],
  },
});
