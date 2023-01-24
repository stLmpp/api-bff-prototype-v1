import { type Request } from 'express';

import { type ApiConfigRequestMappingOtherParams } from './api-config/api-config.js';

export async function mapRequestOtherParams(
  mapping: ApiConfigRequestMappingOtherParams,
  data: Record<string, string>,
  req: Request
): Promise<Record<string, string>> {
  if (typeof mapping === 'function') {
    return data;
  }
  const finalResult: Record<string, string> = {};
  const promises: Promise<void>[] = [];
  for (const [key, value] of Object.entries(mapping)) {
    const dataValue = data[key];
    if (typeof value === 'function') {
      promises.push(
        Promise.resolve(value(dataValue, req)).then((mappedValue) => {
          if (typeof mappedValue !== 'undefined') {
            finalResult[key] = mappedValue;
          }
        })
      );
    } else {
      finalResult[key] = dataValue;
    }
  }
  await Promise.all(promises);
  return finalResult;
}
