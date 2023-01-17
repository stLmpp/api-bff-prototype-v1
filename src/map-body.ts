import { type Request } from 'express';

import { type ApiConfigMappingBody } from './api-config/api-config-body.js';
import { mapGeneric } from './map-generic.js';

export async function mapBody(
  mapping: ApiConfigMappingBody | undefined,
  req: Request
): Promise<unknown> {
  if (!mapping) {
    return undefined;
  }
  const { body } = req;
  if (typeof mapping === 'function') {
    return mapping(body, req);
  }
  return mapGeneric(mapping, body, req);
}
