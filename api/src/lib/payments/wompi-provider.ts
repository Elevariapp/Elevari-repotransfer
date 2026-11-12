import { createHash, timingSafeEqual } from 'node:crypto';
import type { CreateIntentInput, CreateIntentResult, ProviderSyncResult } from './types.js';

type WompiEnvironment = 'sandbox' | 'production';

interface WompiConfig {
  environment: WompiEnvironment;
  publicKey: string;
  privateKey: string;
  eventsSecret: string;
  integritySecret: string;
  apiBase: string;
}

const CHECKOUT_BASE = 'https://checkout.wompi.co/p/';

function getWompiConfig(): WompiConfig {
  const environment = process.env.WOMPI_ENV;
  if (environment !== 'sandbox' && environment !== 'production') {
    throw new Error('WOMPI_ENV must be set to sandbox or production');
  }

  const required = [
    'WOMPI_PUBLIC_KEY',
    'WOMPI_PRIVATE_KEY',
    'WOMPI_EVENTS_SECRET',
    'WOMPI_INTEGRITY_SECRET',
  ] as const;
  const missing = required.filter((name) => !process.env[name]?.trim());
  if (missing.length) {
    throw new Error(`Missing required Wompi environment variables: ${missing.join(', ')}`);
  }

  return {
    environment,
    publicKey: process.env.WOMPI_PUBLIC_KEY!,
    privateKey: process.env.WOMPI_PRIVATE_KEY!,
    eventsSecret: process.env.WOMPI_EVENTS_SECRET!,
    integritySecret: process.env.WOMPI_INTEGRITY_SECRET!,
    apiBase: environment === 'production' ? 'https://production.wompi.co/v1' : 'https://sandbox.wompi.co/v1',
  };
}

/** Validate strictly in live mode; mock environments intentionally need no provider credentials. */
export function validateWompiEnvironment(): void {
  if (process.env.PAYMENTS_MODE !== 'live') return;
  getWompiConfig();
}

export function isWompiAvailable(): boolean {
  if (process.env.PAYMENTS_MODE === 'mock') return true;
  try {
    getWompiConfig();
    return true;
  } catch {
    return false;
  }
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

  if (process.env.PAYMENTS_MODE === 'mock') {
    return {
      paymentId,
      provider: 'wompi',
      mode: 'mock',
      checkoutUrl: `${input.returnUrl}?mock=1&payment_id=${paymentId}`,
    };
  }

  const config = getWompiConfig();
  const cents = amountInCents(input.amount);
  const reference = input.idempotencyKey;
  const signature = createHash('sha256')
    .update(`${reference}${cents}COP${config.integritySecret}`, 'utf8')
    .digest('hex');
  const url = new URL(CHECKOUT_BASE);
  url.searchParams.set('public-key', config.publicKey);
  url.searchParams.set('currency', 'COP');
  url.searchParams.set('amount-in-cents', String(cents));
  url.searchParams.set('reference', reference);
  url.searchParams.set('redirect-url', input.returnUrl);
  url.searchParams.set('signature:integrity', signature);
  if (input.guestEmail) url.searchParams.set('customer-data:email', input.guestEmail);

  return {
    paymentId,
    provider: 'wompi',
    mode: 'live',
    checkoutUrl: url.toString(),
    externalId: reference,
  };
}

export async function syncWompiPayment(transactionId: string): Promise<ProviderSyncResult> {
  const config = getWompiConfig();
  const response = await fetch(`${config.apiBase}/transactions/${encodeURIComponent(transactionId)}`, {
    headers: { Authorization: `Bearer ${config.publicKey}` },
  });
  if (!response.ok) throw new Error(`Wompi transaction lookup failed (${response.status})`);
  const result = await response.json() as {
    data?: { id?: string; status?: string; reference?: string; amount_in_cents?: number; currency?: string };
  };
  const transaction = result.data;
  if (!transaction?.id) throw new Error('Wompi returned an invalid transaction');
  return { paid: transaction.status === 'APPROVED', externalId: transaction.id, raw: transaction };
}

function getPath(source: unknown, path: string): unknown {
  return path.split('.').reduce<unknown>((value, key) => {
    if (!value || typeof value !== 'object') return undefined;
    return (value as Record<string, unknown>)[key];
  }, source);
}

export function verifyWompiWebhook(payload: unknown): boolean {
  let config: WompiConfig;
  try {
    config = getWompiConfig();
  } catch {
    return false;
  }
  if (!payload || typeof payload !== 'object') return false;
  const root = payload as Record<string, unknown>;
  const signature = root.signature as { properties?: unknown; checksum?: unknown } | undefined;
  const timestamp = root.timestamp;
  if (!Array.isArray(signature?.properties) || typeof signature.checksum !== 'string' ||
      (typeof timestamp !== 'string' && typeof timestamp !== 'number')) return false;
  const values = signature.properties.map((path) => typeof path === 'string' ? getPath(root, path) : undefined);
  if (values.some((value) => value === undefined || value === null)) return false;
  const expected = createHash('sha256')
    .update(`${values.join('')}${timestamp}${config.eventsSecret}`, 'utf8')
    .digest();
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

export async function refundWompiTransaction(
  transactionId: string,
  amount: number,
  idempotencyKey: string,
): Promise<{ id?: string; status?: string }> {
  const config = getWompiConfig();
  const response = await fetch(`${config.apiBase}/refunds`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${config.privateKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      transaction_id: transactionId,
      amount_in_cents: amountInCents(amount),
      reference: idempotencyKey,
    }),
  });
  const body = await response.json().catch(() => ({})) as {
    data?: { id?: string; status?: string };
    error?: { message?: string };
  };
  if (!response.ok) throw new Error(body.error?.message ?? `Wompi refund failed (${response.status})`);
  return body.data ?? {};
}
