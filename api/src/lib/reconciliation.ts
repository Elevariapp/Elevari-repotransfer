/**
 * Financial reconciliation engine (Phase 4 · Wave 2).
 *
 * Pure, dependency-free so it can be certified without a database.
 * Every payment is classified; no payment can be "silently inconsistent".
 */

export type ReconciliationStatus =
  | 'MATCHED'
  | 'ORPHAN_PAYMENT'
  | 'MISSING_PAYMENT'
  | 'AMOUNT_MISMATCH'
  | 'CURRENCY_MISMATCH'
  | 'STATUS_MISMATCH';

export interface PaymentLike {
  id: string;
  bookingId: string | null;
  status: string;
  /** Major units as stored in `payments.amount` (COP). */
  amount: number;
  currency: string;
  provider: string;
  externalId?: string | null;
  metadata?: Record<string, unknown> | null;
}

export interface BookingLike {
  id: string;
  status: string;
  feesBreakdown?: unknown;
}

export const CONFIRMED_BOOKING_STATUSES = ['confirmed', 'checked_in', 'completed'] as const;
export const CAPTURED_PAYMENT_STATUSES = ['succeeded', 'partially_refunded', 'refunded'] as const;

export function isCaptured(status: string): boolean {
  return (CAPTURED_PAYMENT_STATUSES as readonly string[]).includes(status);
}

export function isConfirmedBooking(status: string): boolean {
  return (CONFIRMED_BOOKING_STATUSES as readonly string[]).includes(status);
}

/** Expected charge in minor units, from the frozen metadata or the payment amount. */
export function expectedAmountMinor(payment: PaymentLike): number {
  const meta = payment.metadata ?? {};
  const fromMeta = meta['charge_amount_minor'];
  if (typeof fromMeta === 'number' && Number.isFinite(fromMeta)) return Math.round(fromMeta);
  return Math.round(Number(payment.amount) * 100);
}

export function actualAmountMinor(payment: PaymentLike): number {
  return Math.round(Number(payment.amount) * 100);
}

export function expectedCurrency(payment: PaymentLike): string {
  const meta = payment.metadata ?? {};
  const fromMeta = meta['charge_currency'];
  if (typeof fromMeta === 'string' && fromMeta.length > 0) return fromMeta.toUpperCase();
  return (payment.currency ?? '').toUpperCase();
}

export type ReconciliationResult = {
  paymentId: string;
  bookingId: string | null;
  status: ReconciliationStatus;
  reasons: string[];
};

/**
 * Case A -> MATCHED · Case B -> ORPHAN_PAYMENT · Case D -> AMOUNT_MISMATCH
 * Case E -> CURRENCY_MISMATCH · Case F -> STATUS_MISMATCH
 */
export function reconcilePayment(
  payment: PaymentLike,
  booking: BookingLike | null | undefined,
): ReconciliationResult {
  const reasons: string[] = [];
  const bookingId = payment.bookingId ?? null;

  // B — payment without booking evidence.
  if (!bookingId || !booking) {
    return {
      paymentId: payment.id,
      bookingId,
      status: 'ORPHAN_PAYMENT',
      reasons: ['Payment has no resolvable booking'],
    };
  }

  // E — currency must match the frozen charge currency.
  const expectedCcy = expectedCurrency(payment);
  const actualCcy = (payment.currency ?? '').toUpperCase();
  if (expectedCcy && actualCcy && expectedCcy !== actualCcy) {
    reasons.push(`Currency mismatch: expected ${expectedCcy}, got ${actualCcy}`);
    return { paymentId: payment.id, bookingId, status: 'CURRENCY_MISMATCH', reasons };
  }

  // D — amount must match the frozen charge.
  const expectedMinor = expectedAmountMinor(payment);
  const actualMinor = actualAmountMinor(payment);
  if (expectedMinor !== actualMinor) {
    reasons.push(`Amount mismatch: expected ${expectedMinor}, got ${actualMinor} (minor units)`);
    return { paymentId: payment.id, bookingId, status: 'AMOUNT_MISMATCH', reasons };
  }

  const captured = isCaptured(payment.status);
  const confirmed = isConfirmedBooking(booking.status);

  // F — captured payment must be reflected in the booking lifecycle.
  if (captured && !confirmed) {
    reasons.push(
      `Captured payment "${payment.status}" on booking "${booking.status}" — refund or re-confirm required`,
    );
    return { paymentId: payment.id, bookingId, status: 'STATUS_MISMATCH', reasons };
  }

  // F — a confirmed booking cannot rest on a failed/cancelled/pending payment.
  if (confirmed && ['failed', 'cancelled', 'pending', 'processing'].includes(payment.status)) {
    reasons.push(`Confirmed booking backed by "${payment.status}" payment`);
    return { paymentId: payment.id, bookingId, status: 'STATUS_MISMATCH', reasons };
  }

  return { paymentId: payment.id, bookingId, status: 'MATCHED', reasons: [] };
}

/** C — confirmed bookings with no captured payment. */
export function findMissingPayments(
  bookings: BookingLike[],
  payments: PaymentLike[],
): Array<{ bookingId: string; status: ReconciliationStatus; reasons: string[] }> {
  const capturedByBooking = new Set(
    payments.filter((p) => p.bookingId && isCaptured(p.status)).map((p) => p.bookingId as string),
  );
  return bookings
    .filter((b) => isConfirmedBooking(b.status) && !capturedByBooking.has(b.id))
    .map((b) => ({
      bookingId: b.id,
      status: 'MISSING_PAYMENT' as const,
      reasons: [`Booking "${b.status}" has no captured payment`],
    }));
}

export type ReconciliationReport = {
  generatedAt: string;
  totals: { payments: number; bookings: number; matched: number; anomalies: number };
  byStatus: Record<ReconciliationStatus, number>;
  anomalies: Array<{
    status: ReconciliationStatus;
    paymentId?: string;
    bookingId?: string | null;
    reasons: string[];
  }>;
};

const EMPTY_COUNTS: Record<ReconciliationStatus, number> = {
  MATCHED: 0,
  ORPHAN_PAYMENT: 0,
  MISSING_PAYMENT: 0,
  AMOUNT_MISMATCH: 0,
  CURRENCY_MISMATCH: 0,
  STATUS_MISMATCH: 0,
};

export function buildReconciliationReport(
  payments: PaymentLike[],
  bookings: BookingLike[],
  now: Date = new Date(),
): ReconciliationReport {
  const bookingById = new Map(bookings.map((b) => [b.id, b]));
  const byStatus: Record<ReconciliationStatus, number> = { ...EMPTY_COUNTS };
  const anomalies: ReconciliationReport['anomalies'] = [];

  for (const payment of payments) {
    const booking = payment.bookingId ? bookingById.get(payment.bookingId) : null;
    const result = reconcilePayment(payment, booking);
    byStatus[result.status] += 1;
    if (result.status !== 'MATCHED') {
      anomalies.push({
        status: result.status,
        paymentId: result.paymentId,
        bookingId: result.bookingId,
        reasons: result.reasons,
      });
    }
  }

  for (const missing of findMissingPayments(bookings, payments)) {
    byStatus[missing.status] += 1;
    anomalies.push({ status: missing.status, bookingId: missing.bookingId, reasons: missing.reasons });
  }

  return {
    generatedAt: now.toISOString(),
    totals: {
      payments: payments.length,
      bookings: bookings.length,
      matched: byStatus.MATCHED,
      anomalies: anomalies.length,
    },
    byStatus,
    anomalies,
  };
}
