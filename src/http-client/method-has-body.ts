import { type Method } from '../method.js';

export function methodHasBody(method: Method) {
  return !['GET', 'DELETE'].includes(method);
}
