import { Request } from 'express';

function _inObject<K extends string | number>(
  object: object,
  param: K
): object is object & { [Key in K]: unknown } {
  return param in object;
}

type FromBodyFunction = (body: unknown) => unknown;

export function fromBody<K extends string | number>(
  param: K | ((body: unknown) => unknown)
): (_: unknown, req: Request) => unknown {
  const resolver: FromBodyFunction =
    typeof param === 'function'
      ? param
      : (body) => {
          if (!body || typeof body !== 'object' || !_inObject(body, param)) {
            return;
          }
          return body[param];
        };
  return (_, req) => resolver(req.body);
}
