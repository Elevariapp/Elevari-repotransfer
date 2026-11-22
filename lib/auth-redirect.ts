import { safeAuthRedirect } from './auth-session';

/** Full navigation so middleware reads the session cookie immediately after login/register. */
export function navigateAfterAuth(path: string) {
  if (typeof window === 'undefined') return;
  window.location.assign(path);
}

export function resolvePostAuthPath(
  role: 'guest' | 'host' | 'admin',
  redirect?: string | null,
): string {
  const safe = safeAuthRedirect(redirect);

  if (role === 'admin') {
    if (safe.startsWith('/admin')) return safe;
    return '/admin';
  }

  if (role === 'host') {
    if (safe.startsWith('/host') || safe.startsWith('/checkout')) return safe;
    return '/host';
  }

  return safe;
}
