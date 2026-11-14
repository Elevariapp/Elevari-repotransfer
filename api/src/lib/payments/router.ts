/**
 * Provider router — Wompi is the only certified provider.
 *
 * The abstraction (PaymentProvider + createProviderIntent) is intentionally
 * kept so a future provider can be added behind the same contract, but no
 * other implementation ships in this repository.
 *
 * Routing is server-side only; no user can select a provider.
 */
import type { PaymentProvider } from '@prisma/client';
import { getPaymentsConfig } from './config.js';
import { createWompiIntent, isWompiAvailable } from './wompi-provider.js';
import type { CreateIntentInput, CreateIntentResult } from './types.js';

export const SUPPORTED_PROVIDERS: readonly PaymentProvider[] = ['wompi'] as const;

export function resolveProvider(_currency: string, _country?: string): PaymentProvider {
  const cfg = getPaymentsConfig();
  if (cfg.wompiEnabled || cfg.mode === 'mock') return 'wompi';
  throw new Error('No payment provider enabled. Enable Wompi (PAYMENTS_WOMPI_ENABLED=true).');
}

export async function createProviderIntent(
  provider: PaymentProvider,
  input: CreateIntentInput,
  paymentId: string,
): Promise<CreateIntentResult> {
  if (provider !== 'wompi') {
    throw new Error(`Unsupported payment provider: ${provider}. Wompi is the only certified provider.`);
  }

  const cfg = getPaymentsConfig();
  if (!cfg.wompiEnabled && cfg.mode !== 'mock') {
    throw new Error('Wompi provider is disabled');
  }
  return createWompiIntent(input, paymentId);
}

export { isWompiAvailable };

