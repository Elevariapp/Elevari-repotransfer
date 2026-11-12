import type { PaymentProvider } from '@prisma/client';
import { createBoldIntent, isBoldAvailable } from './bold-provider.js';
import { createStripeIntent, isStripeAvailable } from './stripe-provider.js';
import { createWompiIntent, isWompiAvailable } from './wompi-provider.js';
import type { CreateIntentInput, CreateIntentResult } from './types.js';

export function resolveProvider(requested: 'wompi' | 'bold' | 'stripe' | 'auto', currency: string): PaymentProvider {
  if (process.env.PAYMENTS_MODE === 'mock') return 'wompi';
  if (requested !== 'auto') {
    if ((requested === 'wompi' || requested === 'bold') && currency !== 'COP') throw new Error(`${requested} only supports COP`);
    if (requested === 'stripe' && currency !== 'USD') throw new Error('Stripe only supports USD');
    return requested;
  }
  if (currency === 'COP') {
    if (isWompiAvailable()) return 'wompi';
    if (isBoldAvailable()) return 'bold';
    throw new Error('No COP payment provider is configured');
  }
  if (currency === 'USD' && isStripeAvailable()) return 'stripe';
  throw new Error(`No payment provider configured for ${currency}`);
}

export async function createProviderIntent(provider: PaymentProvider, input: CreateIntentInput, paymentId: string): Promise<CreateIntentResult> {
  switch (provider) {
    case 'wompi': return createWompiIntent(input, paymentId);
    case 'bold': return createBoldIntent(input, paymentId);
    case 'stripe': return createStripeIntent(input, paymentId);
  }
}
