/**
 * Session cookie names, shared by the browser (lib/auth-session.ts) and the server
 * (proxy.ts, lib/api-server.ts). They must agree: the browser writes the cookie and the
 * server reads it to protect /account, /host, /admin and the checkout page.
 */
export const SESSION_COOKIE = 'elevari_token';

/** Name used before the rebrand. Still read so sessions started under it keep working. */
export const LEGACY_SESSION_COOKIE = 'wana_token';

/** Production cookies are shared across the elevari.live subdomains. */
export function sessionCookieDomain(hostname: string): string | undefined {
  return hostname === 'elevari.live' || hostname.endsWith('.elevari.live') ? '.elevari.live' : undefined;
}

type CookieGetter = (name: string) => { value: string } | undefined;

export function readSessionCookie(get: CookieGetter): string | undefined {
  return get(SESSION_COOKIE)?.value || get(LEGACY_SESSION_COOKIE)?.value || undefined;
}
