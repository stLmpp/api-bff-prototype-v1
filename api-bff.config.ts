import { defineConfig } from './src/config/config.js';

export default defineConfig({
  prefix: 'api',
  caching: {
    ttl: 15000,
    strategy: 'memory',
  },
  openapi: {
    title: 'My API BFF',
    description: 'My description',
    security: [{ teste: ['teste'] }, { teste2: ['teste2'] }],
    contact: {
      email: 'example@domain.com',
      name: 'example',
      url: 'https://google.com.br',
    },
    externalDocs: {
      url: 'https://google.com.br',
      description: 'Example',
    },
    license: {
      url: 'https://google.com.br',
      name: 'License MIT',
    },
    tags: [
      {
        name: 'Tag1',
        description: 'This is tag 1',
        externalDocs: {
          url: 'https://google.com.br',
          description: 'Tag one',
        },
      },
    ],
    termsOfService: 'This is terms of service',
    version: '1.0.0',
  },
  httpClient: 'axios',
});
