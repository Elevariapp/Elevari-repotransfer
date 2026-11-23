import { Resend } from 'resend';

let client: Resend | undefined;

// Lazy: `new Resend()` throws without an API key, which would break `next build` (CI/Docker).
export function getResend(): Resend {
  if (!client) client = new Resend(process.env.RESEND_API_KEY);
  return client;
}

export const EMAIL_FROM = process.env.EMAIL_FROM ?? 'Elevari <reserve@elevari.live>';
