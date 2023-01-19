import { type ZodError, type ZodIssue, ZodIssueCode } from 'zod';

import { coerceArray } from './coerce-array.js';
import { type ErrorResponseErrorObject } from './error-response.js';
import { groupToMap } from './group-to-map.js';
import { type ParamType } from './param-type.js';
import { uniqWith } from './uniq-with.js';

/**
 * @description Flatten one or multiple {@link ZodError} into an array of objects
 */
export function fromZodErrorToErrorResponseObjects(
  zodErrorOrErrors: ZodError | ZodError[],
  type: ParamType
): ErrorResponseErrorObject[] {
  // Get all errors in an array of objects
  const errors = fromZodErrorToErrorResponseObjectsInternal(
    zodErrorOrErrors,
    type
  );
  // Filter only unique errors
  const uniqueErrors = uniqWith(
    errors,
    (errorA, errorB) =>
      errorA.path === errorB.path &&
      errorA.message === errorB.message &&
      errorA.type === errorB.type
  );
  // Group errors by the path
  const groupedErrors = groupToMap(uniqueErrors, (item) => item.path);
  const finalErrors: ErrorResponseErrorObject[] = [];
  // Loop through all grouped errors and join their descriptions
  for (const [key, value] of groupedErrors) {
    finalErrors.push({
      path: key,
      type,
      message: value.map((item) => item.message).join(' | '),
    });
  }
  return finalErrors;
}

function fromZodErrorToErrorResponseObjectsInternal(
  zodErrorOrErrors: ZodError | ZodError[],
  type: ParamType
): ErrorResponseErrorObject[] {
  const zodErrors = coerceArray(zodErrorOrErrors);
  const getInitial = (): ErrorResponseErrorObject[] => [];
  return zodErrors.reduce(
    (errorsLevel1, error) => [
      ...errorsLevel1,
      ...error.issues.reduce(
        (errorsLevel2, issue) => [
          ...errorsLevel2,
          ...fromZodIssueToErrorResponseObject(issue, type),
        ],
        getInitial()
      ),
    ],
    getInitial()
  );
}

/**
 * @description Flatten a {@link ZodIssue} into an array of objects
 */
export function fromZodIssueToErrorResponseObject(
  issue: ZodIssue,
  type: ParamType
): ErrorResponseErrorObject[] {
  const errors: ErrorResponseErrorObject[] = [
    {
      message: issue.message,
      type,
      path: fromZodIssuePathToString(issue.path),
    },
  ];
  switch (issue.code) {
    case ZodIssueCode.invalid_union: {
      errors.push(
        ...fromZodErrorToErrorResponseObjectsInternal(issue.unionErrors, type)
      );
      break;
    }
    case ZodIssueCode.invalid_arguments: {
      errors.push(
        ...fromZodErrorToErrorResponseObjectsInternal(
          issue.argumentsError,
          type
        )
      );
      break;
    }
    case ZodIssueCode.invalid_return_type: {
      errors.push(
        ...fromZodErrorToErrorResponseObjectsInternal(
          issue.returnTypeError,
          type
        )
      );
      break;
    }
  }
  return errors;
}

/**
 * @description Transform a path array into a string
 * Example: ["config", "requests", 0, "name"] --> "config.requests[0].name"
 */
export function fromZodIssuePathToString(path: (string | number)[]): string {
  return path.reduce((acc: string, item: string | number) => {
    if (typeof item === 'number') {
      return `${acc}[${item}]`;
    }
    return `${acc && acc + '.'}${item}`;
  }, '');
}
