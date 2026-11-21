import Constants from 'expo-constants';

const DEFAULT_API_BASE_URL = 'https://elevari.live';
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Production builds only talk to *.elevari.live over HTTPS, so a stale
 * EXPO_PUBLIC_API_BASE_URL baked in from an .env file cannot silently point a
 * release build at another host. Debug builds accept any override.
 */
function resolveApiBaseUrl(): string {
  const configured = (process.env.EXPO_PUBLIC_API_BASE_URL || '').trim();
  if (!configured) return DEFAULT_API_BASE_URL;
  if (__DEV__) return configured;
  try {
    const url = new URL(configured);
    const trusted =
      url.protocol === 'https:' &&
      (url.hostname === 'elevari.live' || url.hostname.endsWith('.elevari.live'));
    if (trusted) return configured;
  } catch {
    // fall through to the default
  }
  return DEFAULT_API_BASE_URL;
}

export const API_BASE_URL = resolveApiBaseUrl().replace(/\/$/, '');

/** Public site (used for Wompi return URLs and web fallbacks). */
export const SITE_URL = DEFAULT_API_BASE_URL;

export const TURNSTILE_SITE_KEY =
  process.env.EXPO_PUBLIC_TURNSTILE_SITE_KEY || '0x4AAAAAAGL6Nkc1KmMspy5d';

export const CONTACT_EMAIL = 'reserve@elevari.live';

/** Real EAS project id (UUID) or null when the app is not linked to an EAS project. */
export function getEasProjectId(): string | null {
  const candidate =
    process.env.EXPO_PUBLIC_PROJECT_ID ||
    (Constants.expoConfig?.extra?.eas?.projectId as string | undefined) ||
    '';
  return UUID_RE.test(candidate) ? candidate : null;
}
