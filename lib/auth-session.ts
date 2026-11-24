import { LEGACY_SESSION_COOKIE, SESSION_COOKIE, sessionCookieDomain } from './auth-cookie';

const TOKEN_KEY = SESSION_COOKIE;
const LEGACY_TOKEN_KEY = LEGACY_SESSION_COOKIE;
const COOKIE_MAX_AGE = 7 * 24 * 60 * 60;

/** Fired on this tab whenever the stored session is replaced or removed (other tabs get `storage`). */
export const SESSION_CHANGE_EVENT = 'elevari:session-change';

function announceChange() {
  window.dispatchEvent(new Event(SESSION_CHANGE_EVENT));
}

function domainAttribute(): string {
  if (typeof window === 'undefined') return '';
  const domain = sessionCookieDomain(window.location.hostname);
  return domain ? `; Domain=${domain}` : '';
}

function readCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp(`(?:^|;\\s*)${name}=([^;]*)`));
  if (!match?.[1]) return null;
  try {
    return decodeURIComponent(match[1]);
  } catch {
    return match[1];
  }
}

function writeCookie(token: string) {
  const secure = window.location.protocol === 'https:' ? '; Secure' : '';
  const encoded = encodeURIComponent(token);
  document.cookie = `${SESSION_COOKIE}=${encoded}; path=/; max-age=${COOKIE_MAX_AGE}; SameSite=Lax${secure}${domainAttribute()}`;
}

/** Expires the cookie both as host-only and with the shared domain, since they are distinct cookies. */
function expireCookie(name: string) {
  document.cookie = `${name}=; path=/; max-age=0`;
  const domain = domainAttribute();
  if (domain) document.cookie = `${name}=; path=/; max-age=0${domain}`;
}

/** Client token: localStorage first, then sync from cookie (proxy / SSR checkout). */
export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  const fromStorage = localStorage.getItem(TOKEN_KEY);
  if (fromStorage) return fromStorage;
  const fromCookie = readCookie(SESSION_COOKIE);
  if (fromCookie) {
    localStorage.setItem(TOKEN_KEY, fromCookie);
    return fromCookie;
  }
  // Sessions started before the rebrand: carry them over to the current names.
  const legacy = localStorage.getItem(LEGACY_TOKEN_KEY) ?? readCookie(LEGACY_SESSION_COOKIE);
  if (legacy) {
    setSession(legacy);
    return legacy;
  }
  return null;
}

export function setSession(token: string) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(TOKEN_KEY, token);
  writeCookie(token);
  localStorage.removeItem(LEGACY_TOKEN_KEY);
  expireCookie(LEGACY_SESSION_COOKIE);
  announceChange();
}

export function clearSession() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(LEGACY_TOKEN_KEY);
  expireCookie(SESSION_COOKIE);
  expireCookie(LEGACY_SESSION_COOKIE);
  announceChange();
}

export function authHeaders(): Record<string, string> {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

const REDIRECT_PROBE_ORIGIN = 'https://redirect-check.invalid';
const MAX_REDIRECT_LENGTH = 2048;

/**
 * Evita open-redirect en login (?redirect=//evil.com). Only same-origin paths are returned.
 * Browsers read "/\evil.com" like "//evil.com" and strip tab/LF/CR anywhere in a URL, so
 * "/\t/evil.com" would also navigate off-site: control characters are rejected outright and the
 * path is re-parsed to prove it stays on the current origin.
 */
export function safeAuthRedirect(path: unknown): string {
  if (typeof path !== 'string' || !path || path.length > MAX_REDIRECT_LENGTH) return '/';
  if (!path.startsWith('/') || path.startsWith('//')) return '/';
  if (/[\u0000-\u001f\u007f-\u009f\\]/.test(path)) return '/';
  try {
    if (new URL(path, REDIRECT_PROBE_ORIGIN).origin !== REDIRECT_PROBE_ORIGIN) return '/';
  } catch {
    return '/';
  }
  return path;
}
