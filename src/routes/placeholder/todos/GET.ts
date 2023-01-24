import { z } from 'zod';

import { apiConfig } from '../../../api-config/api-config.js';

export default apiConfig({
  host: 'jsonplaceholder.typicode.com',
  path: 'todos',
  response: {
    providerValidation: z.array(
      z.object({
        userId: z.number(),
        id: z.number(),
        title: z.string(),
        completed: z.boolean(),
      })
    ),
    mapping: (items) =>
      items.map((item) => ({ ...item, isBffResponse: 'yes' })),
    validation: z.array(
      z.object({
        userId: z.number(),
        id: z.number(),
        title: z.string(),
        completed: z.boolean(),
        isBffResponse: z.string(),
      })
    ),
  },
});
