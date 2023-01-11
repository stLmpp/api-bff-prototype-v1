import { IncomingHttpHeaders } from 'http';

import { Request } from 'express';

import { ApiConfigMappingHeaders } from './api-config/api-config-header.js';
import { mapGeneric } from './map-generic.js';

export async function mapHeaders(
  mapping: ApiConfigMappingHeaders | undefined,
  req: Request
): Promise<Record<string, string>> {
  if (!mapping) {
    return {};
  }
  const { headers } = req;
  if (typeof mapping === 'function') {
    return _mapHeaders(await mapping(headers, req));
  }
  const object = await mapGeneric(mapping, headers, req);
  return _mapHeaders(object ?? {});
}

function _mapHeaders(
  headers: IncomingHttpHeaders | Record<string, unknown>
): Record<string, string> {
  const initialValue: Record<string, string> = {};
  return Object.entries(headers).reduce((acc, [key, value]) => {
    if (Array.isArray(value)) {
      acc[key] = value.map((item) => String(item)).join(', ');
    }
    if (typeof value !== 'undefined') {
      acc[key] = String(value);
    }
    return acc;
  }, initialValue);
}
