/**
 * Payment state machine — Phase 2.
 *
 * States: PENDING → PROCESSING → PAID (succeeded)
 *         PAID → PARTIALLY_REFUNDED → REFUNDED
 *         PENDING/PROCESSING → FAILED | CANCELLED
 *
 * Rules:
 * - Only `succeeded` (PAID) can confirm a booking.
 * - `failed` never confirms a booking.
 * - `refunded` / `partially_refunded` keep booking in sync via refund flow.
 * - Terminal states: failed, cancelled, refunded.
 */
import { PaymentStatus } from '@prisma/client';

const VALID_TRANSITIONS: Record<PaymentStatus, PaymentStatus[]> = {
  pending: ['processing', 'succeeded', 'failed', 'cancelled'],
  processing: ['succeeded', 'failed', 'cancelled'],
  succeeded: ['partially_refunded', 'refunded'],
  partially_refunded: ['partially_refunded', 'refunded'],
  failed: [],
  cancelled: [],
  refunded: [],
};

export function canTransitionPayment(from: PaymentStatus, to: PaymentStatus): boolean {
  return VALID_TRANSITIONS[from]?.includes(to) ?? false;
}

export function assertPaymentTransition(from: PaymentStatus, to: PaymentStatus): void {
  if (from === to) return; // idempotent no-op
  if (!canTransitionPayment(from, to)) {
    throw new Error(`Invalid payment transition: ${from} → ${to}`);
  }
}

export function isTerminalPayment(status: PaymentStatus): boolean {
  return VALID_TRANSITIONS[status].length === 0;
}

/** Whether this payment status represents money captured (PAID). */
export function isPaidStatus(status: PaymentStatus): boolean {
  return status === 'succeeded' || status === 'partially_refunded' || status === 'refunded';
}
