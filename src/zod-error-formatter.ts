import { ZodError, ZodIssue } from 'zod';

import { ErrorResponseErrorObject } from './error-response.js';
import { ParamType } from './param-type.js';

export function fromZodErrorToErroResponseObjects(
  error: ZodError,
  type: ParamType
): ErrorResponseErrorObject[] {
  return error.errors.map((issue) =>
    fromZodIssueToErrorResponseObject(issue, type)
  );
}

export function fromZodIssueToErrorResponseObject(
  issue: ZodIssue,
  type: ParamType
): ErrorResponseErrorObject {
  return {
    message: issue.message,
    type,
    path: fromZodIssuePathToString(issue.path),
  };
}

export function fromZodIssuePathToString(path: (string | number)[]): string {
  return path.reduce((acc: string, item: string | number) => {
    if (typeof item === 'number') {
      return `${acc}[${item}]`;
    }
    return `${acc}.${item}`;
  }, '');
}
