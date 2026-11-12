import Stripe from 'stripe';
import type { CreateIntentInput, CreateIntentResult, ProviderSyncResult } from './types.js';

let stripeClient: Stripe | null = null;
function getStripe(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  if (!stripeClient) stripeClient = new Stripe(key);
  return stripeClient;
}
export function isStripeAvailable(): boolean { return Boolean(getStripe()) || process.env.PAYMENTS_MODE === 'mock'; }

export async function createStripeIntent(input: CreateIntentInput, paymentId: string): Promise<CreateIntentResult> {
  if (input.currency !== 'USD') throw new Error('Stripe only supports USD; COP conversion is disabled');
  const stripe = getStripe();
  if (!stripe) {
    if (process.env.PAYMENTS_MODE === 'mock') return { paymentId, provider: 'stripe', mode: 'mock', clientSecret: `mock_secret_${paymentId}`, publishableKey: process.env.STRIPE_PUBLISHABLE_KEY ?? 'pk_test_mock' };
    throw new Error('Stripe no configurado. Define STRIPE_SECRET_KEY.');
  }
  const amountCents = Math.round(input.amount * 100);
  if (!Number.isSafeInteger(amountCents) || amountCents < 50) throw new Error('Invalid USD amount for Stripe');
  const intent = await stripe.paymentIntents.create({
    amount: amountCents, currency: 'usd', receipt_email: input.guestEmail, description: input.description,
    metadata: { booking_id: input.bookingId, payment_id: paymentId, idempotency_key: input.idempotencyKey },
    automatic_payment_methods: { enabled: true },
  }, { idempotencyKey: input.idempotencyKey });
  return { paymentId, provider: 'stripe', mode: 'live', clientSecret: intent.client_secret ?? undefined, externalId: intent.id, publishableKey: process.env.STRIPE_PUBLISHABLE_KEY };
}

export async function syncStripePayment(externalId: string): Promise<ProviderSyncResult> {
  const stripe = getStripe();
  if (!stripe) return { paid: false };
  const intent = await stripe.paymentIntents.retrieve(externalId);
  return { paid: intent.status === 'succeeded', externalId: intent.id, raw: { status: intent.status } };
}
export function constructStripeEvent(rawBody: Buffer, signature: string | undefined) {
  const stripe = getStripe();
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!stripe || !secret || !signature) throw new Error('STRIPE_WEBHOOK_NOT_CONFIGURED');
  return stripe.webhooks.constructEvent(rawBody, signature, secret);
}
export { getStripe };
