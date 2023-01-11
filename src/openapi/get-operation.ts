import { StatusCodes } from 'http-status-codes';
import { OperationObject } from 'openapi3-ts';

import { ApiConfig } from '../api-config/api-config.js';

import { getContentSchemaFromZod } from './get-content-schema-from-zod.js';
import { getParameters } from './get-parameters.js';

export function getOperation(apiConfig: ApiConfig): OperationObject {
  const { mapping, openapi } = apiConfig;
  const operation: OperationObject = {
    description: openapi?.description,
    summary: openapi?.summary,
    responses: {},
    parameters: getParameters(apiConfig),
  };
  if (typeof mapping?.in?.body === 'object') {
    operation.requestBody = {
      content: { 'application/json': { schema: { type: 'object' } } },
    };
  }
  if (openapi?.request?.body) {
    operation.requestBody = getContentSchemaFromZod(openapi.request.body);
  }
  if (openapi?.response?.ok) {
    operation.responses[StatusCodes.OK] = getContentSchemaFromZod(
      openapi.response.ok
    );
  }
  if (openapi?.response?.errors?.length) {
    for (const response of openapi.response.errors) {
      if (response.body) {
        operation.responses[response.statusCode] = getContentSchemaFromZod(
          response.body
        );
      }
    }
  }
  return operation;
}
