import { getConfig } from '../config/config.js';

import { HttpClientAxios } from './http-client-axios.js';
import { HttpClientGot } from './http-client-got.js';
import { type HttpClient } from './http-client.js';

let instance: HttpClient | null = null;

function getErrorMessage(client: string): string {
  return `API BFF - "${client}" is not available as a http client, make sure you installed it`;
}

const factoryMap = {
  got: () =>
    import('got')
      .then((m) => new HttpClientGot(m.got))
      .catch((error) => {
        throw new Error(getErrorMessage('got'), { cause: error });
      }),
  axios: () =>
    import('axios')
      .then((m) => new HttpClientAxios(m.default))
      .catch((error) => {
        throw new Error(getErrorMessage('axios'), { cause: error });
      }),
} as const;

export async function getHttpClient(): Promise<HttpClient> {
  if (!instance) {
    const { httpClient } = await getConfig();
    instance = await factoryMap[httpClient]();
  }
  return instance;
}
