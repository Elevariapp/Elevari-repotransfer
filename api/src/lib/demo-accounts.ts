const DEMO_EMAILS = new Set([
  'guest@wana.local',
  'host@wana.local',
  'admin@wana.local',
]);

/** Block seeded demo logins in live production (not mock staging). */
export function isDemoAccountLoginBlocked(email: string): boolean {
  if (process.env.PAYMENTS_MODE === 'mock') {
    return false;
  }
  const normalized = email.trim().toLowerCase();
  if (process.env.DISABLE_DEMO_ACCOUNTS === 'true') {
    return DEMO_EMAILS.has(normalized) || normalized.endsWith('@wana.local');
  }
  if (process.env.NODE_ENV === 'production') {
    return DEMO_EMAILS.has(normalized) || normalized.endsWith('@wana.local');
  }
  return false;
}

export const DEMO_ACCOUNT_BLOCKED_MESSAGE =
  'Las cuentas demo están deshabilitadas en producción. Crea una cuenta nueva o contacta soporte.';
