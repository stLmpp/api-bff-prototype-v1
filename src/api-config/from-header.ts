import { IncomingHttpHeaders } from 'http';

import { Request } from 'express';

import { ApiConfigMappingHeadersSpecificReturn } from './api-config-header.js';

type FromHeaderFunction = (
  params: IncomingHttpHeaders
) => ApiConfigMappingHeadersSpecificReturn;

export function fromHeader(
  param: string | FromHeaderFunction
): (_: unknown, req: Request) => unknown {
  const resolver: FromHeaderFunction =
    typeof param === 'function' ? param : (params) => params[param];
  return (_, req) => resolver(req.headers);
}
