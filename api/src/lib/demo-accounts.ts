const DEMO_EMAILS = new Set([
  'guest@elevari.local',
  'host@elevari.local',
  'admin@elevari.local',
]);

/** Block seeded demo logins in live production (mock mode is only for local development). */
export function isDemoAccountLoginBlocked(email: string): boolean {
  if (process.env.PAYMENTS_MODE === 'mock') {
    return false;
  }
  const normalized = email.trim().toLowerCase();
  if (process.env.DISABLE_DEMO_ACCOUNTS === 'true') {
    return DEMO_EMAILS.has(normalized) || normalized.endsWith('@elevari.local');
  }
  if (process.env.NODE_ENV === 'production') {
    return DEMO_EMAILS.has(normalized) || normalized.endsWith('@elevari.local');
  }
  return false;
}

export const DEMO_ACCOUNT_BLOCKED_MESSAGE =
  'Las cuentas demo están deshabilitadas en producción. Crea una cuenta nueva o contacta soporte.';
