import { z } from 'zod';

import { ApiConfig, forward } from '../../../../../src/api-config';

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
          .min(1),
      }),
      params: z.object({
        id: z.string(),
      }),
      query: z.object({
        test: z.string(),
      }),
      headers: z.object({
        authorization: z.string(),
      }),
    },
  },
} satisfies ApiConfig;
