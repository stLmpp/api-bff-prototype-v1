import type { Got, OptionsOfUnknownResponseBody } from 'got';

import { formatHeaders } from '../format-headers.js';

import { HttpClient, type HttpClientRequestOptions } from './http-client.js';
import { methodHasBody } from './method-has-body.js';
import { validateBody } from './validate-body.js';

export class HttpClientGot extends HttpClient {
  constructor(private readonly got: Got) {
    super();
  }

  async request(
    url: URL,
    options: HttpClientRequestOptions
  ): Promise<Response> {
    const gotOptions: OptionsOfUnknownResponseBody = {
      method: options.method,
      headers: options.headers,
    };
    if (methodHasBody(options.method) && options.body != null) {
      if (typeof options.body === 'string') {
        gotOptions.body = options.body;
      } else {
        gotOptions.json = options.body;
      }
    }
    const response = await this.got(url, gotOptions);
    const body = validateBody(response.body);
    return new Response(body, {
      headers: formatHeaders(response.headers),
      status: response.statusCode,
      statusText: response.statusMessage,
    });
  }
}
