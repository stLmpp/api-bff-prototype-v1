export function formatQuery(
  query: Record<string, unknown>
): Record<string, string> {
  return Object.entries(query).reduce(
    (acc, [key, value]) =>
      value != null ? { ...acc, [key]: String(value) } : acc,
    {}
  );
}
