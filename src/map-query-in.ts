import { type Request } from 'express';

import { type ApiConfigMappingQuery } from './api-config/api-config-query.js';
import { mapGeneric } from './map-generic.js';

export async function mapQueryIn(
  mapping: ApiConfigMappingQuery | undefined,
  req: Request
): Promise<Record<string, string>> {
  if (!mapping) {
    return {};
  }
  const { query } = req;
  if (typeof mapping === 'function') {
    return formatQuery(await mapping(query, req));
  }
  const object = await mapGeneric(mapping, query, req);
  return formatQuery(object ?? {});
}

export function formatQuery(
  query: Record<string, unknown>
): Record<string, string> {
  return Object.entries(query).reduce(
    (acc, [key, value]) =>
      value != null ? { ...acc, [key]: String(value) } : acc,
    {}
  );
}
