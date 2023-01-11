export function env(path: string): () => string | undefined {
  return () => process.env[path];
}
