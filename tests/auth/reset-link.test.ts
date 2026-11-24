import { describe, expect, it } from 'vitest';
import { readResetToken } from '@/lib/reset-link';

describe('readResetToken', () => {
  it('reads the token from the URL fragment', () => {
    expect(readResetToken({ search: '', hash: '#token=abc.def-ghi_jkl' })).toBe('abc.def-ghi_jkl');
  });

  it('still reads links that were e-mailed with a query string', () => {
    expect(readResetToken({ search: '?token=legacy.token.value', hash: '' })).toBe('legacy.token.value');
  });

  it('prefers the fragment when both are present', () => {
    expect(readResetToken({ search: '?token=old', hash: '#token=new' })).toBe('new');
  });

  it('returns an empty string when there is no token', () => {
    expect(readResetToken({ search: '', hash: '' })).toBe('');
    expect(readResetToken({ search: '?utm_source=mail', hash: '#top' })).toBe('');
  });
});
