export function formatEndPoint(path: string): string {
  return path
    .split('/')
    .map((item) => {
      if (!item.startsWith(':')) {
        return item;
      }
      return `{${item.replace(/^:/, '')}}`;
    })
    .join('/');
}
