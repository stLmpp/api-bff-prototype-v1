import { type ApiConfig } from '../../../../api-config/api-config.js';
import { fixed } from '../../../../api-config/fixed.js';
import { forward } from '../../../../api-config/forward.js';
import { fromHeader } from '../../../../api-config/from-header.js';
import { fromQuery } from '../../../../api-config/from-query.js';

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
