/**
 * Provider router — Phase 2 (Wompi-first).
 *
 * Routing policy:
 *   WOMPI enabled  → all payments route to Wompi (only active provider)
 *   WOMPI disabled + mock mode → mock provider behavior via Wompi mock path
 *
 * Bold and Stripe remain in the repository, hidden and disabled unless
 * explicitly re-enabled via PAYMENTS_BOLD_ENABLED / PAYMENTS_STRIPE_ENABLED.
 * No user can select providers — routing is server-side only.
 */
import type { PaymentProvider } from '@prisma/client';
import { getPaymentsConfig } from './config.js';
import { createWompiIntent, isWompiAvailable } from './wompi-provider.js';
import { createBoldIntent } from './bold-provider.js';
import { createStripeIntent } from './stripe-provider.js';
import type { CreateIntentInput, CreateIntentResult } from './types.js';

export function resolveProvider(_currency: string, _country?: string): PaymentProvider {
  const cfg = getPaymentsConfig();
  if (cfg.wompiEnabled) return 'wompi';
  if (cfg.boldEnabled) return 'bold';
  if (cfg.stripeEnabled) return 'stripe';
  if (cfg.mode === 'mock') return 'wompi';
  throw new Error('No payment provider enabled. Enable Wompi (PAYMENTS_WOMPI_ENABLED=true).');
}

export async function createProviderIntent(
  provider: PaymentProvider,
  input: CreateIntentInput,
  paymentId: string,
): Promise<CreateIntentResult> {
  const cfg = getPaymentsConfig();

  if (provider === 'wompi') {
    if (!cfg.wompiEnabled && cfg.mode !== 'mock') {
      throw new Error('Wompi provider is disabled');
    }
    return createWompiIntent(input, paymentId);
  }
  if (provider === 'bold') {
    if (!cfg.boldEnabled && cfg.mode !== 'mock') {
      throw new Error('Bold provider is disabled (hidden — Wompi is the active provider)');
    }
    return createBoldIntent(input, paymentId);
  }
  if (!cfg.stripeEnabled && cfg.mode !== 'mock') {
    throw new Error('Stripe provider is disabled (hidden — Wompi is the active provider)');
  }
  return createStripeIntent(input, paymentId);
}

export { isWompiAvailable };
