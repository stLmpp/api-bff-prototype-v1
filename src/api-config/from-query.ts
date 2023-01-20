import { type Request } from 'express';
import { type ParsedQs } from 'qs';

import { type ApiConfigMappingQuerySpecificReturn } from './api-config-query.js';

type FromQueryFunction = (
  params: ParsedQs
) => ApiConfigMappingQuerySpecificReturn;

export function fromQuery(
  param: string | FromQueryFunction
): (_: unknown, req: Request) => unknown {
  const resolver: FromQueryFunction =
    typeof param === 'function' ? param : (params) => params[param];
  return (_, req) => resolver(req.query);
}
