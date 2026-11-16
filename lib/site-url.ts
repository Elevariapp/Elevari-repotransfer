export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://elevari.app';

export function siteUrl(path = '') {
  const base = SITE_URL.replace(/\/$/, '');
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${base}${cleanPath}`;
}
