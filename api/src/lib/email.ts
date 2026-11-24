import { randomUUID } from 'node:crypto';
import { EMAIL_BRAND } from './email-templates/brand.js';

export const EMAIL_SENDER = {
  name: EMAIL_BRAND.companyName,
  email: 'reserve@elevari.live',
};

export function getEmailBrand() {
  return EMAIL_BRAND;
}

export function publicSiteUrl(): string {
  return (process.env.PUBLIC_SITE_URL ?? 'https://elevari.live').replace(/\/+$/, '');
}

/** Absolute link into the web app, e.g. siteUrl('/account/billing'). */
export function siteUrl(path = '/'): string {
  return `${publicSiteUrl()}${path.startsWith('/') ? path : `/${path}`}`;
}

export interface EmailSendResult {
  sent: boolean;
  reason?: string;
  /** Resend message id when the provider accepted the email. */
  id?: string;
  /** The provider already had this Idempotency-Key, so nothing new was sent. */
  deduped?: boolean;
}

export interface DeliverEmailParams {
  to: string;
  subject: string;
  html: string;
  /**
   * Resend ignores repeats of the same key for 24h. Use a stable key for emails that must
   * go out once per event (booking confirmation, reminders); omit it for "send every time".
   */
  idempotencyKey?: string;
}

const REQUEST_TIMEOUT_MS = 10_000;
const MAX_ATTEMPTS = 3;
const RETRY_BASE_DELAY_MS = 500;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function decodeEntities(value: string): string {
  return value
    .replace(/&nbsp;/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&');
}

/**
 * False only in production without RESEND_API_KEY: nothing can be delivered to anyone, so a
 * caller may say so without revealing anything about a specific recipient.
 */
export function isEmailDeliveryAvailable(): boolean {
  return Boolean(process.env.RESEND_API_KEY?.trim()) || process.env.NODE_ENV !== 'production';
}

/** Plain-text alternative for clients (and spam filters) that want one; keeps link targets. */
export function htmlToText(html: string): string {
  const text = html
    .replace(/<(head|style|script)[\s\S]*?<\/\1>/gi, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<div[^>]*display:none[\s\S]*?<\/div>/gi, '')
    .replace(/<a\s[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/gi, (_match, href: string, label: string) => {
      const labelText = label.replace(/<[^>]+>/g, '').trim();
      if (!labelText || href.startsWith('mailto:')) return labelText || href;
      return labelText === href ? href : `${labelText} (${href})`;
    })
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|h[1-6]|tr|table)>/gi, '\n')
    .replace(/<\/td>/gi, ' ')
    .replace(/<[^>]+>/g, '');

  return decodeEntities(text)
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n[ \t]+/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function retryDelayMs(attempt: number, retryAfterHeader: string | null): number {
  const retryAfterSeconds = Number(retryAfterHeader);
  if (Number.isFinite(retryAfterSeconds) && retryAfterSeconds > 0) {
    return Math.min(retryAfterSeconds * 1000, 5_000);
  }
  return RETRY_BASE_DELAY_MS * 2 ** (attempt - 1);
}

/**
 * Sends one transactional email through Resend's REST API.
 *
 * - Production without RESEND_API_KEY reports `sent: false` (callers like forgot-password
 *   must not tell users an email is on its way when nothing was sent).
 * - Outside production a missing key only logs, so local dev and tests keep working.
 * - Network errors, timeouts, 429 and 5xx are retried; every attempt carries the same
 *   Idempotency-Key, so a retry can never produce a duplicate email.
 * - Never logs the recipient or the message body.
 */
export async function deliverEmail(params: DeliverEmailParams): Promise<EmailSendResult> {
  const to = params.to?.trim();
  if (!to || !to.includes('@')) {
    return { sent: false, reason: 'missing_recipient' };
  }
  const subject = params.subject.replace(/[\r\n]+/g, ' ').trim();

  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) {
    if (process.env.NODE_ENV === 'production') {
      console.error('[email] RESEND_API_KEY is not set: email was NOT sent', { subject });
      return { sent: false, reason: 'not_configured' };
    }
    console.warn('[email] RESEND_API_KEY is not set (non-production): email not sent', { subject });
    return { sent: true, reason: 'dev_log_only' };
  }

  const baseUrl = (process.env.RESEND_API_URL ?? 'https://api.resend.com').replace(/\/+$/, '');
  const from =
    process.env.RESEND_FROM?.trim() || process.env.EMAIL_FROM?.trim() || `${EMAIL_SENDER.name} <${EMAIL_SENDER.email}>`;
  const replyTo = process.env.EMAIL_REPLY_TO?.trim();
  const idempotencyKey = params.idempotencyKey ?? randomUUID();
  const body = JSON.stringify({
    from,
    to: [to],
    subject,
    html: params.html,
    text: htmlToText(params.html),
    ...(replyTo ? { reply_to: replyTo } : {}),
  });

  let lastReason = 'unknown_error';
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    let retryAfter: string | null = null;
    try {
      const response = await fetch(`${baseUrl}/emails`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'Idempotency-Key': idempotencyKey,
          'User-Agent': 'elevari-api',
        },
        body,
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      });

      if (response.ok) {
        const data = (await response.json().catch(() => null)) as { id?: string } | null;
        return { sent: true, id: data?.id };
      }

      const error = (await response.json().catch(() => null)) as { name?: string; message?: string } | null;
      // 409 = this Idempotency-Key was already used (or is being processed): the email exists.
      if (response.status === 409) {
        return { sent: true, deduped: true };
      }

      lastReason = `resend_${response.status}${error?.name ? `_${error.name}` : ''}`;
      const retryable = response.status === 429 || response.status >= 500;
      if (!retryable) {
        console.error('[email] Resend rejected the email', { status: response.status, name: error?.name, subject });
        return { sent: false, reason: lastReason };
      }
      retryAfter = response.headers.get('retry-after');
    } catch (err) {
      lastReason = err instanceof Error && err.name === 'TimeoutError' ? 'resend_timeout' : 'resend_network_error';
    }

    if (attempt < MAX_ATTEMPTS) {
      await sleep(retryDelayMs(attempt, retryAfter));
    }
  }

  console.error('[email] Resend unavailable after retries', { reason: lastReason, subject });
  return { sent: false, reason: lastReason };
}
