import { generateSchema } from '@anatine/zod-openapi';
import {
  type ParameterLocation,
  type ParameterObject,
  type SchemaObject,
} from 'openapi3-ts';
import { ZodObject } from 'zod';

import {
  type ApiConfig,
  type ApiConfigRequestMapping,
  type ApiConfigRequestValidation,
} from '../api-config/api-config.js';
import { type Entries } from '../entries.js';
import { type ParamType } from '../param-type.js';

type Parameters = Record<
  Exclude<ParamType, 'body'>,
  Record<string, ParameterObject>
>;

const paramTypeToSwaggerParameterTypeMap = {
  headers: 'header',
  params: 'path',
  query: 'query',
} satisfies Record<Exclude<ParamType, 'body'>, ParameterLocation>;

function setParametersFromRequestMapping(
  mapping: ApiConfigRequestMapping | undefined,
  parameters: Parameters
): void {
  if (!mapping) {
    return;
  }
  const entries = Object.entries(mapping) as Entries<ApiConfigRequestMapping>;
  for (const [key, value] of entries) {
    if (key === 'body') {
      continue;
    }
    if (typeof value !== 'object') {
      continue;
    }
    const inKey = paramTypeToSwaggerParameterTypeMap[key];
    for (const parameter of Object.keys(value)) {
      parameters[key][parameter] = {
        in: inKey,
        name: parameter,
        schema: { type: 'string' },
      };
    }
  }
}

function setParametersFromRequestValidation(
  request: ApiConfigRequestValidation | undefined,
  parameters: Parameters
): void {
  if (!request) {
    return;
  }
  const entries = Object.entries(
    request
  ) as Entries<ApiConfigRequestValidation>;
  for (const [key, value] of entries) {
    if (key === 'body' || !(value instanceof ZodObject)) {
      continue;
    }
    const schema = generateSchema(value);
    if (schema.type !== 'object' || !schema.properties) {
      continue;
    }
    const inKey = paramTypeToSwaggerParameterTypeMap[key];
    const entriesParameters = Object.entries(schema.properties);
    for (const [parameter, _paramSchema] of entriesParameters) {
      const paramSchema = _paramSchema as SchemaObject;
      parameters[key][parameter] = {
        in: inKey,
        name: parameter,
        schema: paramSchema,
        description: paramSchema.description,
        deprecated: paramSchema.deprecated,
        required: !value.shape[parameter].isOptional(),
        example: paramSchema.example,
      };
    }
  }
}

export function getParameters(config: ApiConfig): ParameterObject[] {
  const parameters: Parameters = {
    headers: {},
    query: {},
    params: {},
  };
  setParametersFromRequestMapping(config.request?.mapping, parameters);
  setParametersFromRequestValidation(config.request?.validation, parameters);
  const parametersSortPriority = {
    path: 1,
    query: 2,
    header: 3,
    cookie: 4,
  } as const;
  const initialValue: ParameterObject[] = [];
  return Object.values(parameters)
    .reduce((acc, item) => [...acc, ...Object.values(item)], initialValue)
    .sort(
      (parameterA, parameterB) =>
        parametersSortPriority[parameterA.in] -
        parametersSortPriority[parameterB.in]
    );
}
