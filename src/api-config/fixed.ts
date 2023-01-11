export function fixed(value: unknown): () => unknown {
  return () => value;
}
