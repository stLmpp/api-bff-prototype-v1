import { Request } from 'express';

import {
  ApiConfigSchemaMappingBody,
  ApiConfigSchemaMappingParam,
} from './api-config.js';

type MapParamsType = 'params' | 'query' | 'headers' | 'body';

export async function mapParams(
  type: 'params' | 'query' | 'headers',
  mapping: ApiConfigSchemaMappingParam | undefined,
  req: Request
): Promise<Record<string, string>>;
export async function mapParams<T>(
  type: 'body',
  mapping: ApiConfigSchemaMappingBody | undefined,
  req: Request
): Promise<T | undefined>;
export async function mapParams(
  type: MapParamsType,
  mapping: ApiConfigSchemaMappingParam | ApiConfigSchemaMappingBody | undefined,
  req: Request
): Promise<Record<string, string> | any> {
  const isParamType = type !== 'body';
  if (!mapping) {
    return isParamType ? {} : undefined;
  }
  const reqData = req[type] ?? {};
  if (typeof mapping === 'function') {
    return mapping(reqData, req);
  }
  const resolveValueFinal = !isParamType
    ? (value: any) => value
    : (value: any) => String(value);
  const entries = Object.entries(mapping);
  const finalResult: Record<string, unknown> = {};
  const promises: Promise<any>[] = [];
  for (const [key, value] of entries) {
    if (typeof value === 'function') {
      promises.push(
        Promise.resolve(value(reqData[key], req)).then((resolvedValue) => {
          if (resolvedValue != null) {
            finalResult[key] = resolveValueFinal(resolvedValue);
          }
        })
      );
    } else {
      const reqValue = reqData[value];
      if (typeof reqValue != null) {
        finalResult[key] = resolveValueFinal(reqValue);
      }
    }
  }
  await Promise.all(promises);
  return finalResult;
}
