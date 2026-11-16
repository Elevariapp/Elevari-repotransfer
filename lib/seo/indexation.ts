import { siteUrl } from '../site-url';

export function isIndexable(path: string): boolean {
  const nonIndexable = ['/admin', '/api', '/checkout', '/auth'];
  return !nonIndexable.some((p) => path.startsWith(p));
}

export function canonicalUrl(path: string) {
  return siteUrl(path);
}
