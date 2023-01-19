import { z } from 'zod';

import { type ApiConfig } from '../../../api-config/api-config.js';

export default {
  host: 'jsonplaceholder.typicode.com',
  path: 'todos',
  mapping: {
    out: {
      ok: (body) => body,
    },
  },
  openapi: {
    response: {
      ok: z.array(
        z.object({
          userId: z.number(),
          id: z.number(),
          title: z.string(),
          completed: z.boolean(),
        })
      ),
    },
  },
} satisfies ApiConfig;
