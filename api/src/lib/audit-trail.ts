/**
 * Financial audit trail (Phase 4 · Wave 2).
 *
 * Reconstructs a full transaction from booking events, payment events and
 * refunds, and reports which lifecycle steps are missing. Pure and testable.
 */

export type TimelineSource = 'booking' | 'payment' | 'refund' | 'webhook';

export interface TimelineInput {
  bookingEvents: Array<{ at: string; type: string; from?: string | null; to?: string | null }>;
  paymentEvents: Array<{ at: string; type: string; payload?: Record<string, unknown> | null }>;
  refunds: Array<{ at: string; status: string; amountMinor: number }>;
  paymentStatuses: string[];
}

export interface TimelineEntry {
  at: string;
  source: TimelineSource;
  type: string;
  detail?: string;
}

export interface TimelineResult {
  entries: TimelineEntry[];
  complete: boolean;
  missingSteps: string[];
}

const REQUIRED_STEPS = ['booking_created', 'payment_created', 'payment_outcome'] as const;

function hasBookingCreated(types: string[]): boolean {
  return types.some((t) => ['booking_created', 'created', 'draft', 'pending_payment'].includes(t));
}

export function buildTransactionTimeline(input: TimelineInput): TimelineResult {
  const entries: TimelineEntry[] = [];

  for (const event of input.bookingEvents) {
    entries.push({
      at: event.at,
      source: 'booking',
      type: `booking:${event.type}`,
      detail: event.from && event.to ? `${event.from} → ${event.to}` : undefined,
    });
  }

  for (const event of input.paymentEvents) {
    const isWebhook = event.type.startsWith('webhook');
    entries.push({
      at: event.at,
      source: isWebhook ? 'webhook' : 'payment',
      type: `payment:${event.type}`,
    });
  }

  for (const refund of input.refunds) {
    entries.push({
      at: refund.at,
      source: 'refund',
      type: `refund:${refund.status}`,
      detail: `${refund.amountMinor} minor units`,
    });
  }

  entries.sort((a, b) => (a.at < b.at ? -1 : a.at > b.at ? 1 : 0));

  const bookingTypes = input.bookingEvents.map((e) => e.type);
  const paymentTypes = input.paymentEvents.map((e) => e.type);
  const missingSteps: string[] = [];

  if (!hasBookingCreated(bookingTypes)) missingSteps.push(REQUIRED_STEPS[0]);

  const paymentCreated = paymentTypes.some((t) => ['payment_created', 'payment_started'].includes(t));
  if (!paymentCreated && input.paymentStatuses.length === 0) missingSteps.push(REQUIRED_STEPS[1]);

  const outcome = paymentTypes.some((t) =>
    ['payment_paid', 'payment_failed', 'payment_paid_international', 'payment_failed_international'].includes(t),
  );
  const statusOutcome = input.paymentStatuses.some((s) =>
    ['succeeded', 'failed', 'cancelled', 'refunded', 'partially_refunded'].includes(s),
  );
  if (!outcome && !statusOutcome) missingSteps.push(REQUIRED_STEPS[2]);

  return { entries, complete: missingSteps.length === 0, missingSteps };
}
