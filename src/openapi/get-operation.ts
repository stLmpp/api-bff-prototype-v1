import { StatusCodes } from 'http-status-codes';
import { type OperationObject } from 'openapi3-ts';

import { type ApiConfig } from '../api-config/api-config.js';
import { ErrorResponseSchema } from '../error-response.js';

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
  if (response?.validation) {
    operation.responses[StatusCodes.OK] = getContentSchemaFromZod(
      response.validation
    );
  }
  if (response?.possibleErrors?.length) {
    const schema = getContentSchemaFromZod(ErrorResponseSchema);
    // TODO add status code fixed
    for (const statusCode of response.possibleErrors) {
      operation.responses[statusCode] = schema;
    }
  }

  return operation;
}
