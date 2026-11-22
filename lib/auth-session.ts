const TOKEN_KEY = 'wana_token';
const COOKIE_MAX_AGE = 7 * 24 * 60 * 60;

export interface AuthUser {
  id: string;
  email: string;
  name: string | null;
  role: 'guest' | 'host' | 'admin';
}

function cookieDomainAttribute(): string {
  if (typeof window === 'undefined') return '';
  const host = window.location.hostname;
  if (host === 'eleveri.app' || host.endsWith('.eleveri.app')) {
    return '; Domain=.eleveri.app';
  }
  return '';
}

function readCookieToken(): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(/(?:^|;\s*)wana_token=([^;]*)/);
  if (!match?.[1]) return null;
  try {
    return decodeURIComponent(match[1]);
  } catch {
    return match[1];
  }
}

/** Client token: localStorage first, then sync from cookie (middleware / SSR checkout). */
export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  const fromStorage = localStorage.getItem(TOKEN_KEY);
  if (fromStorage) return fromStorage;
  const fromCookie = readCookieToken();
  if (fromCookie) {
    localStorage.setItem(TOKEN_KEY, fromCookie);
    return fromCookie;
  }
  return null;
}

export function setSession(token: string) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(TOKEN_KEY, token);
  const secure = window.location.protocol === 'https:' ? '; Secure' : '';
  const encoded = encodeURIComponent(token);
  document.cookie = `wana_token=${encoded}; path=/; max-age=${COOKIE_MAX_AGE}; SameSite=Lax${secure}${cookieDomainAttribute()}`;
}

export function clearSession() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(TOKEN_KEY);
  document.cookie = `wana_token=; path=/; max-age=0${cookieDomainAttribute()}`;
}

export function authHeaders(): Record<string, string> {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

/** Evita open-redirect en login (?redirect=//evil.com). */
export function safeAuthRedirect(path: string | null | undefined): string {
  if (!path) return '/';
  if (path.startsWith('/') && !path.startsWith('//')) return path;
  return '/';
}
