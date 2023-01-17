import { type Request } from 'express';

import { type ApiConfigMappingParamSpecificReturn } from './api-config-param.js';

type FromParamFunction = (
  params: Record<string, string>
) => ApiConfigMappingParamSpecificReturn;

export function fromParam(
  param: string | FromParamFunction
): (_: unknown, req: Request) => unknown {
  const resolver: FromParamFunction =
    typeof param === 'function' ? param : (params) => params[param];
  return (_, req) => resolver(req.params);
}
