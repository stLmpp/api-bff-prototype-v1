import { type Axios, type RawAxiosRequestConfig } from 'axios';

import { formatHeaders } from '../map-headers-in.js';

import { HttpClient, type HttpClientRequestOptions } from './http-client.js';
import { methodHasBody } from './method-has-body.js';
import { validateBody } from './validate-body.js';

export class HttpClientAxios extends HttpClient {
  constructor(private readonly axios: Axios) {
    super();
  }

  async request(
    url: URL,
    options: HttpClientRequestOptions
  ): Promise<Response> {
    const axiosOptions: RawAxiosRequestConfig = {
      url: url.toString(),
      method: options.method,
      headers: options.headers,
    };
    if (methodHasBody(options.method) && options.body != null) {
      axiosOptions.data = options.body;
    }
    const response = await this.axios.request(axiosOptions);
    const body = validateBody(response.data);
    return new Response(body, {
      headers: formatHeaders(response.headers),
      status: response.status,
      statusText: response.statusText,
    });
  }
}
