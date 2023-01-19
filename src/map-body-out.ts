import { type ApiConfigMappingOutResponse } from './api-config/api-config.js';
import { mapGeneric } from './map-generic.js';

export async function mapBodyOut(
  mapping: ApiConfigMappingOutResponse | undefined,
  data: unknown
): Promise<unknown> {
  if (!mapping) {
    return data;
  }
  if (typeof mapping === 'function') {
    return mapping(data);
  }
  const finalResult = await mapGeneric(mapping, data);
  return finalResult ?? data;
}
