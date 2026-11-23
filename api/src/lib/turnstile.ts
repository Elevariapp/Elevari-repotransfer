import type { FastifyRequest } from 'fastify';

export type TurnstileVerifyResult = {
  ok: boolean;
  errorCodes?: string[];
};

const VERIFY_TIMEOUT_MS = 8_000;

export async function verifyTurnstileToken(
  token: string,
  remoteip?: string,
): Promise<TurnstileVerifyResult> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) return { ok: true };

  if (!token) return { ok: false, errorCodes: ['missing-input-response'] };

  try {
    const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        secret,
        response: token,
        ...(remoteip ? { remoteip } : {}),
      }),
      signal: AbortSignal.timeout(VERIFY_TIMEOUT_MS),
    });

    const data = (await res.json()) as { success?: boolean; 'error-codes'?: string[] };
    return {
      ok: data.success === true,
      errorCodes: data['error-codes'],
    };
  } catch {
    // Fail closed, but with a distinct code so the user is told to retry rather than "bot".
    return { ok: false, errorCodes: ['verification-unavailable'] };
  }
}

export function turnstileRequired(): boolean {
  if (process.env.TURNSTILE_DISABLED === '1') return false;
  return Boolean(process.env.TURNSTILE_SECRET_KEY);
}

/** Real client address: relies on Fastify's `trustProxy`, with nginx setting a single trusted hop. */
export function clientIp(request: FastifyRequest): string | undefined {
  return request.ip;
}
