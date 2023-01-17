import { type Method } from '../method.js';

export interface HttpClientRequestOptions {
  method: Method;
  body?: unknown;
  headers?: Record<string, string>;
}

export abstract class HttpClient {
  abstract request(
    url: URL,
    options: HttpClientRequestOptions
  ): Promise<Response>;
}
