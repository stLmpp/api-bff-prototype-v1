export function isRecord(object: unknown): object is Record<string, unknown> {
  return !!object && typeof object === 'object';
}
