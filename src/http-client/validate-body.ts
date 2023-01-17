export function validateBody(body: unknown): string | null {
  if (body == null) {
    return null;
  }
  if (Buffer.isBuffer(body)) {
    try {
      return validateBody(body.toString());
    } catch {
      return null;
    }
  }
  if (typeof body === 'string') {
    try {
      JSON.parse(body);
      return body;
    } catch {
      return null;
    }
  }
  try {
    return JSON.stringify(body);
  } catch {
    return null;
  }
}
