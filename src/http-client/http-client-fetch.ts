import { HttpClient, type HttpClientRequestOptions } from './http-client.js';
import { methodHasBody } from './method-has-body.js';

export class HttpClientFetch extends HttpClient {
  request(url: URL, options: HttpClientRequestOptions): Promise<Response> {
    const fetchOptions: RequestInit = {
      method: options.method,
      headers: options.headers,
    };
    if (methodHasBody(options.method) && options.body) {
      if (typeof options.body === 'string') {
        fetchOptions.body = options.body;
      } else {
        fetchOptions.body = JSON.stringify(options.body);
      }
    }
    return fetch(url, {
      method: options.method,
      headers: options.headers,
    });
  }
}
