import { MediaApiError, NETWORK_ERROR_MESSAGE, SESSION_EXPIRED_MESSAGE, apiErrorMessage } from '@/lib/media-api';

/** HTTP status of an ApiError / MediaApiError / analytics error, or null for network and unknown failures. */
export function errorStatus(err: unknown): number | null {
  const status = (err as { status?: unknown } | null)?.status;
  return typeof status === 'number' && status > 0 ? status : null;
}

export function isUnauthorized(err: unknown): boolean {
  return errorStatus(err) === 401;
}

/** Spanish message for errors raised by the host API wrappers; raw server text is never shown for 403/429/5xx. */
export function hostErrorMessage(err: unknown, fallback: string): string {
  // Media errors were already turned into Spanish (with their specific reason) by lib/media-api.
  if (err instanceof MediaApiError) return err.message;
  const status = errorStatus(err);
  if (status === null) return NETWORK_ERROR_MESSAGE;
  if (status === 401) return SESSION_EXPIRED_MESSAGE;
  if (status === 403 || status === 429 || status >= 500) return apiErrorMessage(status, null, fallback);
  return err instanceof Error && err.message ? err.message : fallback;
}
