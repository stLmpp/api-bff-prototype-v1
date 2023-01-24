import { StatusCodes } from 'http-status-codes';
import { type OperationObject } from 'openapi3-ts';

import { type ApiConfig } from '../api-config/api-config.js';
import { uniq } from '../uniq.js';

import { getContentSchemaFromZod } from './get-content-schema-from-zod.js';
import { getErrorSchema } from './get-error-schema.js';
import { getParameters } from './get-parameters.js';

export function getOperation(apiConfig: ApiConfig): OperationObject {
  const { request, response, description, summary } = apiConfig;
  const operation: OperationObject = {
    description,
    summary,
    responses: {},
    parameters: getParameters(apiConfig),
    tags: apiConfig.tags,
  };
  if (request?.mapping?.body && typeof request.mapping.body === 'object') {
    operation.requestBody = {
      content: { 'application/json': { schema: { type: 'object' } } },
    };
  }
  if (request?.validation?.body) {
    operation.requestBody = getContentSchemaFromZod(request.validation.body);
  }
  if (response?.validation) {
    operation.responses[StatusCodes.OK] = getContentSchemaFromZod(
      response.validation
    );
  }
  const possibleErrors = uniq([
    ...(response?.possibleErrors ?? []),
    StatusCodes.MISDIRECTED_REQUEST,
    StatusCodes.INTERNAL_SERVER_ERROR,
    StatusCodes.BAD_REQUEST,
  ]).sort((statusA, statusB) => statusA - statusB);
  for (const statusCode of possibleErrors) {
    operation.responses[statusCode] = getErrorSchema(statusCode);
  }

  return operation;
}
