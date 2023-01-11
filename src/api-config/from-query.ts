import { Request } from 'express';
import { ParsedQs } from 'qs';

import { ApiConfigMappingParamSpecificReturn } from './api-config-param.js';

type FromQueryFunction = (
  params: ParsedQs
) => ApiConfigMappingParamSpecificReturn;

export function fromQuery(
  param: string | FromQueryFunction
): (_: unknown, req: Request) => unknown {
  const resolver: FromQueryFunction =
    typeof param === 'function' ? param : (params) => params[param];
  return (_, req) => resolver(req.query);
}
