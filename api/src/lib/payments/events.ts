/**
 * Payment observability — Phase 2 (WS10).
 *
 * Every payment-related action is recorded as a PaymentEvent with a
 * correlation ID so a full timeline can be reconstructed per booking,
 * payment, quote or refund.
 */
import { randomUUID } from 'node:crypto';
import { prisma } from '../prisma.js';

export function newCorrelationId(): string {
  return randomUUID();
}

export async function recordPaymentEvent(params: {
  type: string;
  correlationId: string;
  paymentId?: string | null;
  bookingId?: string | null;
  quoteId?: string | null;
  refundId?: string | null;
  payload?: unknown;
}): Promise<void> {
  await prisma.paymentEvent.create({
    data: {
      id: randomUUID(),
      type: params.type,
      correlationId: params.correlationId,
      paymentId: params.paymentId ?? null,
      bookingId: params.bookingId ?? null,
      quoteId: params.quoteId ?? null,
      refundId: params.refundId ?? null,
      payload: params.payload === undefined ? undefined : (params.payload as object),
    },
  });
}
