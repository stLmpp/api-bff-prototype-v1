import { type Request } from 'express';

import { type ApiConfigMappingParam } from './api-config/api-config-param.js';
import { mapGeneric } from './map-generic.js';

export async function mapParamsIn(
  mapping: ApiConfigMappingParam | undefined,
  req: Request
): Promise<Record<string, string>> {
  if (!mapping) {
    return {};
  }
  const { params } = req;
  if (typeof mapping === 'function') {
    return _formatParams(await mapping(params, req));
  }
  const object = await mapGeneric(mapping, params, req);
  return _formatParams(object ?? {});
}

function _formatParams(
  params: Record<string, unknown>
): Record<string, string> {
  return Object.entries(params).reduce(
    (acc, [key, value]) =>
      typeof value === 'undefined' ? acc : { ...acc, [key]: value },
    {}
  );
}
