import { describe, expect, it, vi } from 'vitest';

vi.mock('../../mobile/node_modules/expo-constants', () => ({ default: { expoConfig: { extra: {} } } }));
vi.mock('../../mobile/lib/auth', () => ({ authStorage: {} }));

import { getApiErrorMessage } from '../../mobile/lib/api';

// axios.isAxiosError is duck-typed, so a plain object is enough to exercise the message mapping.
function apiError(status: number, data: unknown) {
  return { isAxiosError: true, response: { status, data, headers: {} } };
}

describe('getApiErrorMessage (mobile) - rate limits', () => {
  it('shows the wait the server asks for when an account is locked after failed logins', () => {
    const error = apiError(429, {
      error: 'Demasiados intentos fallidos. Por seguridad, espera 15 minutos e inténtalo de nuevo o restablece tu contraseña.',
      code: 'login_locked',
      retry_after_seconds: 900,
    });
    expect(getApiErrorMessage(error)).toMatch(/espera 15 minutos/);
  });

  it('keeps the generic text for ordinary rate limiting', () => {
    expect(getApiErrorMessage(apiError(429, { error: 'Too Many Requests', statusCode: 429 }))).toMatch(
      /Demasiados intentos/,
    );
    expect(getApiErrorMessage(apiError(429, ''))).toMatch(/Demasiados intentos/);
  });

  it('does not trust a blank lock message', () => {
    expect(getApiErrorMessage(apiError(429, { error: '   ', code: 'login_locked' }))).toMatch(/Demasiados intentos/);
  });
});
