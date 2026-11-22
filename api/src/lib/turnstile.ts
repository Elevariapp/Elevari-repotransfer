import type { FastifyRequest } from 'fastify';

export type TurnstileVerifyResult = {
  ok: boolean;
  errorCodes?: string[];
};

export async function verifyTurnstileToken(
  token: string,
  remoteip?: string,
): Promise<TurnstileVerifyResult> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) return { ok: true };

  if (!token) return { ok: false, errorCodes: ['missing-input-response'] };

  const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      secret,
      response: token,
      ...(remoteip ? { remoteip } : {}),
    }),
  });

  const data = (await res.json()) as { success?: boolean; 'error-codes'?: string[] };
  return {
    ok: data.success === true,
    errorCodes: data['error-codes'],
  };
}

export function turnstileRequired(): boolean {
  if (process.env.TURNSTILE_DISABLED === '1') return false;
  return Boolean(process.env.TURNSTILE_SECRET_KEY);
}

export function clientIp(request: FastifyRequest): string | undefined {
  const forwarded = request.headers['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.length > 0) {
    return forwarded.split(',')[0]?.trim();
  }
  return request.ip;
}
