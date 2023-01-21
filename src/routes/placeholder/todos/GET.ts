import { z } from 'zod';

import { apiConfig } from '../../../api-config/api-config.js';

export default apiConfig({
  host: 'jsonplaceholder.typicode.com',
  path: 'todos',
  response: {
    validationProvider: {
      ok: z.array(
        z.object({
          userId: z.number(),
          id: z.number(),
          title: z.string(),
          completed: z.boolean(),
        })
      ),
    },
    mapping: {
      ok: (body) => body,
    },
    validation: {
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
});
