/**
 * Wompi provider — Phase 2. Wompi is the ONLY active payment provider.
 *
 * Implements: payment creation (checkout link), transaction status sync,
 * webhook signature validation, refunds, reconciliation helpers.
 *
 * All amounts use integer minor units (centavos COP).
 */
import { createHash } from 'node:crypto';
import { getPaymentsConfig, type WompiConfig } from './config.js';
import { assertMinorUnits, toMinorUnits } from './money.js';
import type { CreateIntentInput, CreateIntentResult, ProviderSyncResult } from './types.js';

const WOMPI_SANDBOX_BASE = 'https://sandbox.wompi.co/v1';
const WOMPI_PRODUCTION_BASE = 'https://production.wompi.co/v1';

function wompiBase(cfg: WompiConfig): string {
  return cfg.env === 'production' ? WOMPI_PRODUCTION_BASE : WOMPI_SANDBOX_BASE;
}

export function getWompiConfig(): WompiConfig | null {
  return getPaymentsConfig().wompi;
}

export function isWompiAvailable(): boolean {
  return getPaymentsConfig().wompiEnabled;
}

/** SHA256 hex — used for Wompi integrity signature and webhook checksum. */
function sha256Hex(input: string): string {
  return createHash('sha256').update(input, 'utf8').digest('hex');
}

/**
 * Build the Wompi checkout URL (hosted checkout / web checkout).
 * Integrity signature: sha256(`${reference}${amountInCents}${currency}${integritySecret}`)
 */
export async function createWompiIntent(
  input: CreateIntentInput,
  paymentId: string,
): Promise<CreateIntentResult> {
  const cfg = getWompiConfig();

  if (!cfg) {
    if (process.env.PAYMENTS_MODE === 'mock' || process.env.NODE_ENV === 'development') {
      return {
        paymentId,
        provider: 'wompi',
        mode: 'mock',
        checkoutUrl: `${input.returnUrl}?mock=1&payment_id=${paymentId}`,
      };
    }
    throw new Error('Wompi no configurado. Define WOMPI_* (ver .env.wompi.example).');
  }

  const amountMinor = toMinorUnits(input.amount);
  assertMinorUnits(amountMinor, 'amount_in_cents');

  const reference = input.idempotencyKey;
  const currency = 'COP';
  const integrity = sha256Hex(`${reference}${amountMinor}${currency}${cfg.integritySecret}`);

  const params = new URLSearchParams({
    'public-key': cfg.publicKey,
    currency,
    'amount-in-cents': String(amountMinor),
    reference,
    'signature:integrity': integrity,
    'redirect-url': input.returnUrl,
  });
  if (input.guestEmail) params.set('customer-data:email', input.guestEmail);
  if (input.guestName) params.set('customer-data:full-name', input.guestName);

  const checkoutUrl = `https://checkout.wompi.co/p/?${params.toString()}`;

  return {
    paymentId,
    provider: 'wompi',
    mode: 'live',
    checkoutUrl,
    publishableKey: cfg.publicKey,
  };
}

/**
 * Resolve a Wompi transaction by reference (idempotency key).
 * Used both by manual sync and webhook fallback.
 */
export async function syncWompiPayment(reference: string): Promise<ProviderSyncResult> {
  const cfg = getWompiConfig();
  if (!cfg) return { paid: false };

  const res = await fetch(
    `${wompiBase(cfg)}/transactions?reference=${encodeURIComponent(reference)}`,
    { headers: { Authorization: `Bearer ${cfg.privateKey}` } },
  );

  if (!res.ok) {
    return { paid: false };
  }

  const data = (await res.json()) as {
    data?: Array<{ id: string; status: string; amount_in_cents: number }>;
  };

  const tx = data.data?.[0];
  if (!tx) return { paid: false };

  return {
    paid: tx.status === 'APPROVED',
    declined: tx.status === 'DECLINED' || tx.status === 'ERROR' || tx.status === 'VOIDED',
    externalId: tx.id,
    raw: tx,
  };
}

export interface WompiEventPayload {
  event: string;
  data: {
    transaction: {
      id: string;
      status: string;
      reference: string;
      amount_in_cents: number;
      currency: string;
    };
  };
  signature: { properties: string[]; checksum: string };
  timestamp: number;
}

/**
 * Verify Wompi webhook signature.
 * checksum = sha256(concat(values of signature.properties) + timestamp + eventsSecret)
 */
export function verifyWompiWebhook(payload: WompiEventPayload): boolean {
  const cfg = getWompiConfig();
  if (!cfg) {
    return process.env.NODE_ENV !== 'production' && process.env.PAYMENTS_MODE === 'mock';
  }

  const props = payload?.signature?.properties;
  const checksum = payload?.signature?.checksum;
  if (!Array.isArray(props) || !checksum || typeof payload.timestamp !== 'number') {
    return false;
  }

  const tx = payload.data?.transaction as Record<string, unknown> | undefined;
  if (!tx) return false;

  let concatenated = '';
  for (const prop of props) {
    const key = prop.replace(/^transaction\./, '');
    const value = tx[key];
    concatenated += value === undefined || value === null ? '' : String(value);
  }

  const expected = sha256Hex(`${concatenated}${payload.timestamp}${cfg.eventsSecret}`);
  return expected === checksum;
}

export function parseWompiWebhook(payload: WompiEventPayload): {
  reference?: string;
  transactionId?: string;
  status?: string;
  amountMinor?: number;
  currency?: string;
  eventType?: string;
} {
  const tx = payload?.data?.transaction;
  return {
    reference: tx?.reference,
    transactionId: tx?.id,
    status: tx?.status,
    amountMinor: tx?.amount_in_cents,
    currency: tx?.currency,
    eventType: payload?.event,
  };
}

/**
 * Create a refund via Wompi API.
 * Wompi's void endpoint refunds the FULL transaction and does not accept an
 * amount, so it is only safe for full refunds. Partial refunds are surfaced as
 * pending_manual to avoid refunding more money than the guest is owed.
 */
export async function refundWompiPayment(params: {
  transactionId: string;
  amountMinor: number;
  fullAmountMinor: number;
}): Promise<{ refunded: boolean; providerRefundId?: string; pendingManual?: boolean; reason?: string }> {
  const cfg = getWompiConfig();
  if (!cfg) {
    return { refunded: false, pendingManual: true, reason: 'Wompi not configured' };
  }

  if (params.amountMinor < params.fullAmountMinor) {
    return {
      refunded: false,
      pendingManual: true,
      reason:
        'Partial refunds are not supported by the Wompi void API — process the partial amount manually in the Wompi dashboard',
    };
  }

  // Full refund: void the transaction.
  const res = await fetch(`${wompiBase(cfg)}/transactions/${params.transactionId}/void`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${cfg.privateKey}`,
      'Content-Type': 'application/json',
    },
  });

  if (res.ok) {
    const data = (await res.json()) as { data?: { id?: string } };
    return { refunded: true, providerRefundId: data.data?.id ?? params.transactionId };
  }

  return {
    refunded: false,
    pendingManual: true,
    reason: `Wompi refund API returned ${res.status} — process manually in Wompi dashboard`,
  };
}
