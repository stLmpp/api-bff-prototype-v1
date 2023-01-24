import { z } from 'zod';

import { apiConfig } from '../../../../api-config/api-config.js';
import { fixed } from '../../../../api-config/fixed.js';

export default apiConfig({
  host: 'jsonplaceholder.typicode.com',
  path: 'todos/:id',
  request: {
    validation: {
      query: z.object({
        teste: z.string(),
        id: z.string(),
        'from-another': z.string(),
      }),
      params: z.object({
        id: z.string(),
      }),
      headers: z.object({
        authorization: z.string(),
        'x-custom': z.string(),
      }),
    },
    mapping: {
      params: {
        id: 'id',
      },
      headers: {
        'x-api-bff': fixed('true'),
        authorization: 'authorization',
      },
      query: {
        teste: 'teste',
        teste2: fixed('fixed value'),
        teste3: 'from-another',
        pathId: { param: 'id' },
      },
      body: {
        id: { query: 'id' },
        auth: { header: (headers) => headers.authorization },
      },
    },
  },
});
