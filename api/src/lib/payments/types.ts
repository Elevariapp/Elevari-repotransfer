import type { PaymentProvider } from '@prisma/client';

export interface CreateIntentInput {
  bookingId: string;
  amount: number;
  currency: string;
  idempotencyKey: string;
  description: string;
  guestEmail: string;
  guestName: string;
  returnUrl: string;
}

export interface CreateIntentResult {
  paymentId: string;
  provider: PaymentProvider;
  /** Bold: redirect URL. Stripe: client secret. Mock: null */
  checkoutUrl?: string;
  clientSecret?: string;
  externalId?: string;
  publishableKey?: string;
  mode: 'live' | 'mock';
}

export interface ProviderSyncResult {
  paid: boolean;
  /** True when the provider reports a definitive decline/error/void. */
  declined?: boolean;
  externalId?: string;
  raw?: unknown;
}
