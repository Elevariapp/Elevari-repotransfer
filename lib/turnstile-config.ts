/** Turnstile activo salvo bypass explícito (staging debug). */
export function isTurnstileEnabledClient(): boolean {
  if (process.env.NEXT_PUBLIC_TURNSTILE_DISABLED === '1') return false;
  return Boolean(process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY);
}
