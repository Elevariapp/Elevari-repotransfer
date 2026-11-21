import { api } from './api';
import { AppError } from './errors';
import { SITE_URL } from './config';
import type {
  PaymentIntentBody,
  PaymentIntentResponse,
  PaymentStatus,
  PaymentSyncResponse,
  PaymentsByBookingResponse,
} from '@/types';

const FINAL_STATUSES: PaymentStatus[] = ['succeeded', 'failed', 'cancelled', 'refunded', 'partially_refunded'];

export function isFinalPaymentStatus(status: PaymentStatus): boolean {
  return FINAL_STATUSES.includes(status);
}

/** Same URL the web checkout uses as Wompi's redirect-url (see CheckoutClient.tsx). */
export function paymentReturnUrl(bookingId: string): string {
  return `${SITE_URL}/checkout/${bookingId}/success`;
}

export interface PaymentStart {
  alreadyPaid: boolean;
  paymentId: string | null;
  checkoutUrl: string | null;
}

/**
 * Creates (or reuses) the Wompi payment for a booking via POST /payments/intent.
 * The idempotency key is also the Wompi reference, so an unfinished payment keeps its
 * key and a failed/cancelled one gets a fresh key.
 */
export async function startPayment(bookingId: string): Promise<PaymentStart> {
  const existing = await api.get<PaymentsByBookingResponse>(`/payments/by-booking/${bookingId}`);
  const payments = existing.payments ?? [];

  if (payments.some((p) => p.status === 'succeeded')) {
    return { alreadyPaid: true, paymentId: null, checkoutUrl: null };
  }

  const active = payments.find((p) => p.status === 'pending' || p.status === 'processing');
  const idempotencyKey = active
    ? active.idempotencyKey
    : payments.length > 0
      ? `pay_${bookingId}_wompi_${Date.now().toString(36)}`
      : `pay_${bookingId}_wompi`;

  const body: PaymentIntentBody = {
    booking_id: bookingId,
    idempotency_key: idempotencyKey,
    return_url: paymentReturnUrl(bookingId),
    display_currency: 'COP',
    locale: 'es',
  };
  const response = await api.post<PaymentIntentResponse>('/payments/intent', body);

  if (response.already_paid) {
    return { alreadyPaid: true, paymentId: response.payment?.id ?? null, checkoutUrl: null };
  }

  // Mock checkouts only exist in non-production API modes; the app never completes them.
  if (response.mode === 'mock') {
    throw new AppError('El pago en línea no está disponible en este momento. Inténtalo más tarde.');
  }

  const paymentId = response.payment_id ?? response.payment?.id ?? null;
  const checkoutUrl = response.checkout_url ?? null;
  if (!paymentId || !checkoutUrl || !/^https:\/\//i.test(checkoutUrl)) {
    throw new AppError('No se pudo iniciar el pago. Inténtalo de nuevo.');
  }
  return { alreadyPaid: false, paymentId, checkoutUrl };
}

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

/**
 * Asks the API to reconcile the payment with Wompi (POST /payments/:id/sync) until it
 * reaches a final status. Returns the last response, or null if none could be fetched.
 */
export async function waitForPayment(
  paymentId: string,
  options: { attempts?: number; intervalMs?: number; isCancelled?: () => boolean } = {}
): Promise<PaymentSyncResponse | null> {
  const { attempts = 10, intervalMs = 3000, isCancelled } = options;
  let last: PaymentSyncResponse | null = null;

  for (let i = 0; i < attempts; i += 1) {
    if (isCancelled?.()) return last;
    try {
      last = await api.post<PaymentSyncResponse>(`/payments/${paymentId}/sync`);
      if (isFinalPaymentStatus(last.status)) return last;
    } catch {
      // Transient network/API failure: keep polling until attempts run out.
    }
    if (i < attempts - 1) await sleep(intervalMs);
  }
  return last;
}
