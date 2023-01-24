import { type Request } from 'express';

import { type ApiConfigRequestMappingParams } from './api-config/api-config.js';

export async function mapRequestParams(
  mapping: ApiConfigRequestMappingParams,
  data: Record<string, string>,
  req: Request
): Promise<Record<string, string>> {
  if (typeof mapping === 'function') {
    return mapping(data, req);
  }
  const finalResult: Record<string, string> = {};
  const promises: Promise<void>[] = [];
  for (const [key, value] of Object.entries(mapping)) {
    const dataValue = data[key];
    if (typeof value === 'function') {
      promises.push(
        Promise.resolve(value(dataValue, req)).then((mappedValue) => {
          finalResult[key] = mappedValue;
        })
      );
    } else {
      finalResult[key] = dataValue;
    }
  }
  await Promise.all(promises);
  return finalResult;
}
