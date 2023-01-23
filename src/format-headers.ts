import { type IncomingHttpHeaders } from 'http';

export function formatHeaders(
  headers: IncomingHttpHeaders | Record<string, unknown>
): Record<string, string> {
  const initialValue: Record<string, string> = {};
  return Object.entries(headers).reduce((acc, [key, value]) => {
    if (Array.isArray(value)) {
      acc[key] = value.map((item) => String(item)).join(', ');
    }
    if (typeof value !== 'undefined') {
      acc[key] = String(value);
    }
    return acc;
  }, initialValue);
}
