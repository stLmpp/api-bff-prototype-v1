export function fixed<T>(value: T): () => T {
  return () => value;
}
