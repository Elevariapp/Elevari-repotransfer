import { Resend } from 'resend';

let client: Resend | undefined;

// Lazy: `new Resend()` throws without a key, which must not break `next build`.
export function getResend(): Resend {
  client ??= new Resend(process.env.RESEND_API_KEY);
  return client;
}

export const EMAIL_FROM = process.env.EMAIL_FROM ?? 'Elevari <reserve@elevari.live>';