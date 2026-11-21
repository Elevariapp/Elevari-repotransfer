/**
 * Base URL of the Elevari API (without /api/v1).
 *
 * - Browser: NEXT_PUBLIC_API_URL (public domain, goes through Cloudflare).
 * - Server (SSR / route handlers): INTERNAL_API_URL when set (e.g. http://api:4000 on the Docker network),
 *   which avoids a round trip over the internet and does not depend on public DNS.
 */
export function apiBase(): string {
  if (typeof window === 'undefined' && process.env.INTERNAL_API_URL) {
    return process.env.INTERNAL_API_URL;
  }
  return process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';
}
