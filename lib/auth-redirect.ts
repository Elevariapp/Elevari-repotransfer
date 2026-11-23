import { safeAuthRedirect } from './auth-session';

/** Full navigation so middleware reads the session cookie immediately after login/register. */
export function navigateAfterAuth(path: string) {
  if (typeof window === 'undefined') return;
  window.location.assign(path);
}

/** An explicit destination (e.g. the page that sent the user to log in) wins; otherwise the role's home. */
export function resolvePostAuthPath(
  role: 'guest' | 'host' | 'admin',
  redirect?: string | null,
): string {
  const safe = safeAuthRedirect(redirect);
  if (safe !== '/') return safe;

  if (role === 'admin') return '/admin';
  if (role === 'host') return '/host';
  return '/';
}
