import { ApiConfig, fixed, forward } from '../../../../../src/api-config.js';

export default {
  host: 'jsonplaceholder.typicode.com',
  path: 'todos/:id',
  mapping: {
    in: {
      headers: {
        'x-api-bff': fixed(true),
        authorization: forward(),
      },
    },
  },
} satisfies ApiConfig;
