import type { FastifyRequest, FastifyReply } from 'fastify';
import { safeEqual } from './auth.js';
import { clientIp, verifyTurnstileToken, turnstileRequired } from './turnstile.js';

/**
 * Native clients (the mobile app) can't render the Turnstile widget. When `API_CLIENT_KEY`
 * is set, requests carrying the same value in `x-api-key` skip the challenge. The key ships
 * inside the app, so it identifies the app rather than proving anything: rate limits still apply.
 */
function hasTrustedClientKey(request: FastifyRequest): boolean {
  const expected = process.env.API_CLIENT_KEY;
  if (!expected) return false;
  const provided = request.headers['x-api-key'];
  return typeof provided === 'string' && provided.length > 0 && safeEqual(provided, expected);
}

export async function requireTurnstile(
  request: FastifyRequest,
  reply: FastifyReply,
  token: string | undefined,
): Promise<boolean> {
  if (!turnstileRequired()) return true;
  if (hasTrustedClientKey(request)) return true;

  const result = await verifyTurnstileToken(token ?? '', clientIp(request));
  if (!result.ok) {
    request.log.warn({ turnstile: result.errorCodes }, 'Turnstile verification failed');
    const unavailable = result.errorCodes?.includes('verification-unavailable');
    const expired = result.errorCodes?.includes('timeout-or-duplicate');
    reply.status(unavailable ? 503 : 400).send({
      error: unavailable
        ? 'No pudimos completar la verificación de seguridad. Intenta de nuevo en unos segundos.'
        : expired
          ? 'La verificación expiró. Marca de nuevo el checkbox de seguridad e intenta otra vez.'
          : 'Verificación de seguridad fallida. Marca el checkbox e intenta de nuevo.',
      code: 'turnstile_failed',
    });
    return false;
  }
  return true;
}
