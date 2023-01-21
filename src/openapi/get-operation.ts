import { StatusCodes } from 'http-status-codes';
import { type OperationObject } from 'openapi3-ts';
import { type Entries } from 'type-fest';

import { type ApiConfig } from '../api-config/api-config.js';

import { getContentSchemaFromZod } from './get-content-schema-from-zod.js';
import { getParameters } from './get-parameters.js';

export function getOperation(apiConfig: ApiConfig): OperationObject {
  const { request, response, description, summary } = apiConfig;
  const operation: OperationObject = {
    description,
    summary,
    responses: {},
    parameters: getParameters(apiConfig),
  };
  if (request?.mapping?.body && typeof request.mapping.body === 'object') {
    operation.requestBody = {
      content: { 'application/json': { schema: { type: 'object' } } },
    };
  }
  if (request?.validation?.body) {
    operation.requestBody = getContentSchemaFromZod(request.validation.body);
  }
  if (response?.validation?.ok) {
    operation.responses[StatusCodes.OK] = getContentSchemaFromZod(
      response.validation.ok
    );
  }
  if (response?.validation?.errors) {
    const entries = Object.entries(response.validation.errors) as Entries<
      typeof response.validation.errors
    >;
    for (const [statusCode, schema] of entries) {
      if (statusCode === 'default') {
        continue;
      }
      operation.responses[statusCode] = getContentSchemaFromZod(schema);
    }
  }

  return operation;
}
