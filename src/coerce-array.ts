export function isArray(array: unknown): array is readonly unknown[] {
  return Array.isArray(array);
}

export function coerceArray<T>(possibleArray: T | T[] | readonly T[]): T[] {
  return isArray(possibleArray) ? [...possibleArray] : [possibleArray];
}
