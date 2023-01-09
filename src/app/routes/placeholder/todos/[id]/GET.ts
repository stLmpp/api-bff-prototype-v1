import {
  ApiConfig,
  fixed,
  forward,
  fromHeader,
  fromQuery,
} from '../../../../../api-config.js';

export default {
  host: 'jsonplaceholder.typicode.com',
  path: 'todos/:id',
  mapping: {
    in: {
      params: {
        id: forward(),
      },
      headers: {
        'x-api-bff': fixed(true),
        authorization: forward(),
      },
      query: {
        teste: forward(),
        teste2: fixed('fixed value'),
        teste3: 'from-another',
      },
      body: {
        id: fromQuery('id'),
        auth: fromHeader((param) => param.authorization),
      },
    },
  },
} satisfies ApiConfig;
