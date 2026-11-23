import { api } from './api';
import type { BillingResponse, InvoiceStatus } from './types';

export const INVOICE_STATUS_LABELS: Record<InvoiceStatus, string> = {
  issued: 'Emitida',
  pending: 'En proceso',
};

export const INVOICE_STATUS_TONES: Record<InvoiceStatus, 'success' | 'warning'> = {
  issued: 'success',
  pending: 'warning',
};

const PROVIDER_LABELS: Record<string, string> = {
  wompi: 'Wompi',
  stripe: 'Stripe',
};

export function providerLabel(provider: string): string {
  return PROVIDER_LABELS[provider.toLowerCase()] ?? provider;
}

// Payments and invoices come from the same endpoint; each screen shows its own part.
export async function fetchBilling(): Promise<BillingResponse> {
  const response = await api.get<Partial<BillingResponse>>('/account/billing');
  return {
    payments: Array.isArray(response.payments) ? response.payments : [],
    invoices: Array.isArray(response.invoices) ? response.invoices : [],
  };
}
