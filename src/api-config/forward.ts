export function forward<T>(): (value: T) => T {
  return (value) => value;
}
