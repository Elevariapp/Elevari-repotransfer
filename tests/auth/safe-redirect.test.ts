import { describe, expect, it } from 'vitest';
import { resolvePostAuthPath } from '@/lib/auth-redirect';
import { safeAuthRedirect } from '@/lib/auth-session';

describe('safeAuthRedirect', () => {
  it.each(['/', '/host', '/host/add-property', '/account?tab=reservas', '/checkout?booking=abc#pago'])(
    'keeps the same-origin path %s',
    (path) => {
      expect(safeAuthRedirect(path)).toBe(path);
    },
  );

  it.each([
    ['protocol-relative', '//evil.com'],
    ['triple slash', '///evil.com'],
    ['backslash', '/\\evil.com'],
    ['slash + backslash', '/\\/evil.com'],
    ['absolute https url', 'https://evil.com'],
    ['javascript url', 'javascript:alert(1)'],
    ['no leading slash', 'evil.com'],
    // The URL parser strips tab / LF / CR, so these become "//evil.com" in the browser.
    ['tab', '/\t/evil.com'],
    ['line feed', '/\n/evil.com'],
    ['carriage return', '/\r/evil.com'],
    ['nul', '/\u0000/evil.com'],
    ['c1 control', '/\u0085/evil.com'],
    ['too long', `/${'a'.repeat(3000)}`],
  ])('falls back to "/" for %s', (_label, path) => {
    expect(safeAuthRedirect(path)).toBe('/');
  });

  it('falls back to "/" for missing or non-string values (repeated ?redirect= arrives as an array)', () => {
    expect(safeAuthRedirect(undefined)).toBe('/');
    expect(safeAuthRedirect(null)).toBe('/');
    expect(safeAuthRedirect('')).toBe('/');
    expect(safeAuthRedirect(['/host', '/account'])).toBe('/');
  });

  it('never resolves to another origin for any rejected-or-accepted payload', () => {
    const origin = 'https://elevari.live';
    const payloads = ['/\t/evil.com', '/\n/evil.com', '//evil.com', '/%09/evil.com', '/a/../../evil.com', '/host'];
    for (const payload of payloads) {
      expect(new URL(safeAuthRedirect(payload), origin).origin).toBe(origin);
    }
  });
});

describe('resolvePostAuthPath', () => {
  it('sends every role to its home when there is no explicit destination', () => {
    expect(resolvePostAuthPath('guest')).toBe('/');
    expect(resolvePostAuthPath('host')).toBe('/host');
    expect(resolvePostAuthPath('admin')).toBe('/admin');
  });

  it('honours a safe destination and ignores an unsafe one', () => {
    expect(resolvePostAuthPath('host', '/account')).toBe('/account');
    expect(resolvePostAuthPath('host', '/\t/evil.com')).toBe('/host');
    expect(resolvePostAuthPath('guest', '//evil.com')).toBe('/');
  });
});
