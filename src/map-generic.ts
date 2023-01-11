import { Request } from 'express';

import { ApiConfigMappingBodyObject } from './api-config/api-config-body.js';
import { ApiConfigMappingHeadersObject } from './api-config/api-config-header.js';
import { ApiConfigMappingParamObject } from './api-config/api-config-param.js';
import { ApiConfigMappingQueryObject } from './api-config/api-config-query.js';

function _isRecord(object: unknown): object is Record<string, unknown> {
  return !!object && typeof object === 'object';
}

export async function mapGeneric(
  mapping:
    | ApiConfigMappingBodyObject
    | ApiConfigMappingQueryObject
    | ApiConfigMappingHeadersObject
    | ApiConfigMappingParamObject,
  data: unknown,
  req: Request
): Promise<Record<string, unknown> | undefined> {
  if (!_isRecord(data)) {
    return undefined;
  }
  const finalResult: Record<string, unknown> = {};
  const promises: Promise<unknown>[] = [];
  for (const [key, value] of Object.entries(mapping)) {
    const dataValue = data[key];
    if (typeof value === 'function') {
      // Casting necessary here because the type of 'dataValue' will be always unknown
      const valueFn = value as (value: unknown, req: Request) => unknown;
      promises.push(
        Promise.resolve(valueFn(dataValue, req)).then((mappedValue) => {
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
