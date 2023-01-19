import { type IncomingHttpHeaders } from 'http';

import { type Request } from 'express';

import { type ApiConfigMappingHeaders } from './api-config/api-config-header.js';
import { mapGeneric } from './map-generic.js';

export async function mapHeadersIn(
  mapping: ApiConfigMappingHeaders | undefined,
  req: Request
): Promise<Record<string, string>> {
  if (!mapping) {
    return {};
  }
  const { headers } = req;
  if (typeof mapping === 'function') {
    return formatHeaders(await mapping(headers, req));
  }
  const object = await mapGeneric(mapping, headers, req);
  return formatHeaders(object ?? {});
}

export function formatHeaders(
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
