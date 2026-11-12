import { createHash, timingSafeEqual } from 'node:crypto';
import type { CreateIntentInput, CreateIntentResult, ProviderSyncResult } from './types.js';

const API_BASE = process.env.WOMPI_API_BASE_URL ??
  (process.env.WOMPI_ENVIRONMENT === 'production' ? 'https://production.wompi.co/v1' : 'https://sandbox.wompi.co/v1');
const CHECKOUT_BASE = process.env.WOMPI_CHECKOUT_BASE_URL ?? 'https://checkout.wompi.co/p/';

export function isWompiAvailable(): boolean {
  return Boolean(process.env.WOMPI_PUBLIC_KEY && process.env.WOMPI_INTEGRITY_SECRET) ||
    process.env.PAYMENTS_MODE === 'mock';
}

function amountInCents(amount: number): number {
  if (!Number.isFinite(amount) || amount <= 0) throw new Error('Invalid Wompi amount');
  const cents = Math.round(amount * 100);
  if (!Number.isSafeInteger(cents)) throw new Error('Invalid Wompi amount');
  return cents;
}

export async function createWompiIntent(
  input: CreateIntentInput,
  paymentId: string,
): Promise<CreateIntentResult> {
  if (input.currency !== 'COP') throw new Error('Wompi only supports COP bookings');
  const publicKey = process.env.WOMPI_PUBLIC_KEY;
  const integritySecret = process.env.WOMPI_INTEGRITY_SECRET;
  if (!publicKey || !integritySecret) {
    if (process.env.PAYMENTS_MODE === 'mock') {
      return { paymentId, provider: 'wompi', mode: 'mock', checkoutUrl: `${input.returnUrl}?mock=1&payment_id=${paymentId}` };
    }
    throw new Error('Wompi is not configured');
  }

  const cents = amountInCents(input.amount);
  const reference = input.idempotencyKey;
  const signature = createHash('sha256')
    .update(`${reference}${cents}COP${integritySecret}`, 'utf8')
    .digest('hex');
  const url = new URL(CHECKOUT_BASE);
  url.searchParams.set('public-key', publicKey);
  url.searchParams.set('currency', 'COP');
  url.searchParams.set('amount-in-cents', String(cents));
  url.searchParams.set('reference', reference);
  url.searchParams.set('redirect-url', input.returnUrl);
  url.searchParams.set('signature:integrity', signature);
  url.searchParams.set('customer-data:email', input.guestEmail);
  return { paymentId, provider: 'wompi', mode: 'live', checkoutUrl: url.toString(), externalId: reference };
}

export async function syncWompiPayment(transactionId: string): Promise<ProviderSyncResult> {
  const publicKey = process.env.WOMPI_PUBLIC_KEY;
  if (!publicKey) throw new Error('WOMPI_PUBLIC_KEY is not configured');
  const response = await fetch(`${API_BASE}/transactions/${encodeURIComponent(transactionId)}`, {
    headers: { Authorization: `Bearer ${publicKey}` },
  });
  if (!response.ok) throw new Error(`Wompi transaction lookup failed (${response.status})`);
  const result = await response.json() as { data?: { id?: string; status?: string; reference?: string; amount_in_cents?: number; currency?: string } };
  const transaction = result.data;
  if (!transaction?.id) throw new Error('Wompi returned an invalid transaction');
  return {
    paid: transaction.status === 'APPROVED',
    externalId: transaction.id,
    raw: transaction,
  };
}

function getPath(source: unknown, path: string): unknown {
  return path.split('.').reduce<unknown>((value, key) => {
    if (!value || typeof value !== 'object') return undefined;
    return (value as Record<string, unknown>)[key];
  }, source);
}

export function verifyWompiWebhook(payload: unknown): boolean {
  const secret = process.env.WOMPI_EVENTS_SECRET;
  if (!secret || !payload || typeof payload !== 'object') return false;
  const root = payload as Record<string, unknown>;
  const signature = root.signature as { properties?: unknown; checksum?: unknown } | undefined;
  const timestamp = root.timestamp;
  if (!Array.isArray(signature?.properties) || typeof signature.checksum !== 'string' || (typeof timestamp !== 'string' && typeof timestamp !== 'number')) return false;
  const values = signature.properties.map((path) => typeof path === 'string' ? getPath(root, path) : undefined);
  if (values.some((value) => value === undefined || value === null)) return false;
  const expected = createHash('sha256').update(`${values.join('')}${timestamp}${secret}`, 'utf8').digest();
  let received: Buffer;
  try { received = Buffer.from(signature.checksum, 'hex'); } catch { return false; }
  return received.length === expected.length && timingSafeEqual(received, expected);
}

export function wompiTransactionFromWebhook(payload: unknown): { transactionId: string; reference?: string } | null {
  if (!payload || typeof payload !== 'object') return null;
  const root = payload as Record<string, unknown>;
  const data = root.data as Record<string, unknown> | undefined;
  const transaction = data?.transaction as Record<string, unknown> | undefined;
  if (!transaction || typeof transaction.id !== 'string') return null;
  return {
    transactionId: transaction.id,
    reference: typeof transaction.reference === 'string' ? transaction.reference : undefined,
  };
}

export async function refundWompiTransaction(transactionId: string, amount: number, idempotencyKey: string): Promise<{ id?: string; status?: string }> {
  const privateKey = process.env.WOMPI_PRIVATE_KEY;
  if (!privateKey) throw new Error('WOMPI_PRIVATE_KEY is not configured');
  const response = await fetch(`${API_BASE}/refunds`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${privateKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ transaction_id: transactionId, amount_in_cents: amountInCents(amount), reference: idempotencyKey }),
  });
  const body = await response.json().catch(() => ({})) as { data?: { id?: string; status?: string }; error?: { message?: string } };
  if (!response.ok) throw new Error(body.error?.message ?? `Wompi refund failed (${response.status})`);
  return body.data ?? {};
}
