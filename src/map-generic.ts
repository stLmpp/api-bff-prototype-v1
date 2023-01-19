import { type Request } from 'express';

import { type ApiConfigMappingBodyObject } from './api-config/api-config-body.js';
import { type ApiConfigMappingHeadersObject } from './api-config/api-config-header.js';
import { type ApiConfigMappingParamObject } from './api-config/api-config-param.js';
import { type ApiConfigMappingQueryObject } from './api-config/api-config-query.js';
import { type ApiConfigMappingOutResponse } from './api-config/api-config.js';
import { isRecord } from './is-record.js';

export async function mapGeneric(
  mapping:
    | ApiConfigMappingBodyObject
    | ApiConfigMappingQueryObject
    | ApiConfigMappingHeadersObject
    | ApiConfigMappingParamObject,
  data: unknown,
  req: Request
): Promise<Record<string, unknown> | undefined>;
export async function mapGeneric(
  mapping: ApiConfigMappingOutResponse,
  data: unknown
): Promise<Record<string, unknown> | undefined>;
export async function mapGeneric(
  mapping:
    | ApiConfigMappingBodyObject
    | ApiConfigMappingQueryObject
    | ApiConfigMappingHeadersObject
    | ApiConfigMappingParamObject
    | ApiConfigMappingOutResponse,
  data: unknown,
  req?: Request
): Promise<Record<string, unknown> | undefined> {
  if (!isRecord(data)) {
    return undefined;
  }
  const finalResult: Record<string, unknown> = {};
  const promises: Promise<unknown>[] = [];
  for (const [key, value] of Object.entries(mapping)) {
    const dataValue = data[key];
    if (typeof value === 'function') {
      // Casting necessary here because the type of 'dataValue' will be always unknown
      const valueFn = value as (value: unknown, req?: Request) => unknown;
      const promise = Promise.resolve(
        req ? valueFn(dataValue, req) : valueFn(dataValue)
      );
      promises.push(
        promise.then((mappedValue) => {
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
