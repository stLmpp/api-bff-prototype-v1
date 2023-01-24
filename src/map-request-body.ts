import { type Request } from 'express';

import { type ApiConfigRequestMappingBody } from './api-config/api-config.js';
import { isRecord } from './is-record.js';

export async function mapRequestBody(
  mapping: ApiConfigRequestMappingBody,
  data: unknown,
  req: Request
): Promise<unknown> {
  if (typeof mapping === 'function') {
    return mapping(data, req);
  }
  if (!isRecord(data)) {
    return data;
  }
  const finalResult: Record<string, unknown> = {};
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
    } else if (typeof dataValue !== 'undefined') {
      finalResult[key] = dataValue;
    }
  }
  await Promise.all(promises);
  return finalResult;
}
