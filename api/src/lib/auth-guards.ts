import type { FastifyRequest, FastifyReply } from 'fastify';
import { clientIp, verifyTurnstileToken, turnstileRequired } from './turnstile.js';

export async function requireTurnstile(
  request: FastifyRequest,
  reply: FastifyReply,
  token: string | undefined,
): Promise<boolean> {
  if (!turnstileRequired()) return true;

  const result = await verifyTurnstileToken(token ?? '', clientIp(request));
  if (!result.ok) {
    request.log.warn({ turnstile: result.errorCodes }, 'Turnstile verification failed');
    const expired = result.errorCodes?.includes('timeout-or-duplicate');
    reply.status(400).send({
      error: expired
        ? 'La verificación expiró. Marca de nuevo el checkbox de seguridad e intenta otra vez.'
        : 'Verificación de seguridad fallida. Marca el checkbox e intenta de nuevo.',
      code: 'turnstile_failed',
    });
    return false;
  }
  return true;
}
