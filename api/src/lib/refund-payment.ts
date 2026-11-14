import type { Payment } from '@prisma/client';
import Stripe from 'stripe';
import { randomUUID } from 'node:crypto';
import { prisma } from './prisma.js';
import { refundWompiPayment } from './payments/wompi-provider.js';
import { assertPaymentTransition } from './payments/payment-state.js';
import { toMinorUnits } from './payments/money.js';
import { recordPaymentEvent, newCorrelationId } from './payments/events.js';

export type RefundResult =
  | { status: 'refunded'; provider_refund_id?: string; partial?: boolean }
  | { status: 'pending_manual'; reason: string }
  | { status: 'skipped'; reason: string }
  | { status: 'failed'; reason: string };

function getStripe(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  return new Stripe(key);
}

/**
 * Issue a refund for a payment. Amount is in COP major units (as stored in
 * payment.amount). Refunds never reprice via new FX rates — the refunded
 * amount equals (a portion of) the original charged COP amount.
 */
export async function issuePaymentRefund(
  payment: Payment,
  refundAmount: number,
): Promise<RefundResult> {
  if (refundAmount <= 0) {
    return { status: 'skipped', reason: 'No refund amount due' };
  }

  if (payment.status !== 'succeeded' && payment.status !== 'partially_refunded') {
    return { status: 'skipped', reason: 'Payment was not succeeded' };
  }

  const correlationId = newCorrelationId();
  const chargedMinor = toMinorUnits(Number(payment.amount));
  const refundMinor = Math.min(toMinorUnits(refundAmount), chargedMinor);
  const meta = (payment.metadata ?? {}) as Record<string, unknown>;
  const originalAmountMinor =
    typeof meta.charge_amount_minor === 'number' ? meta.charge_amount_minor : chargedMinor;
  const quoteRate = typeof meta.quote_rate === 'number' ? meta.quote_rate : null;

  const priorRefunds = await prisma.paymentRefund.aggregate({
    where: { paymentId: payment.id, status: { in: ['refunded', 'pending_manual'] } },
    _sum: { amountMinor: true },
  });
  const alreadyRefundedMinor = priorRefunds._sum.amountMinor ?? 0;
  if (alreadyRefundedMinor + refundMinor > originalAmountMinor) {
    return { status: 'failed', reason: 'Refund exceeds original charged amount' };
  }

  const isPartial = alreadyRefundedMinor + refundMinor < originalAmountMinor;

  const refundRow = await prisma.paymentRefund.create({
    data: {
      id: randomUUID(),
      paymentId: payment.id,
      amountMinor: refundMinor,
      currency: payment.currency,
      status: 'pending',
      originalAmountMinor,
      quoteRate: quoteRate ?? undefined,
    },
  });

  const finalize = async (
    status: 'refunded' | 'pending_manual' | 'failed',
    providerRefundId?: string,
    reason?: string,
  ): Promise<RefundResult> => {
    await prisma.paymentRefund.update({
      where: { id: refundRow.id },
      data: { status, providerRefundId: providerRefundId ?? null, reason: reason ?? null },
    });

    if (status === 'refunded') {
      const newStatus = isPartial ? 'partially_refunded' : 'refunded';
      assertPaymentTransition(payment.status, newStatus);
      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: newStatus,
          metadata: { ...meta, last_refund_id: refundRow.id },
        },
      });
    }

    await recordPaymentEvent({
      type: `refund_${status}`,
      correlationId,
      paymentId: payment.id,
      bookingId: payment.bookingId,
      refundId: refundRow.id,
      payload: { amount_minor: refundMinor, partial: isPartial, provider_refund_id: providerRefundId },
    });

    if (status === 'refunded') {
      return { status: 'refunded', provider_refund_id: providerRefundId, partial: isPartial };
    }
    if (status === 'pending_manual') {
      return { status: 'pending_manual', reason: reason ?? 'Manual refund required' };
    }
    return { status: 'failed', reason: reason ?? 'Refund failed' };
  };

  // Mock
  if (process.env.PAYMENTS_MODE === 'mock' || payment.externalId?.startsWith('mock_')) {
    return finalize('refunded', `mock_refund_${payment.id}`);
  }

  // Wompi
  if (payment.provider === 'wompi') {
    if (!payment.externalId) {
      return finalize('pending_manual', undefined, 'Wompi transaction id missing — refund manually');
    }
    const res = await refundWompiPayment({
      transactionId: payment.externalId,
      amountMinor: refundMinor,
    });
    if (res.refunded) {
      return finalize('refunded', res.providerRefundId);
    }
    return finalize(
      'pending_manual',
      undefined,
      res.reason ?? 'Wompi refund must be processed manually in the Wompi dashboard',
    );
  }

  // Stripe
  if (payment.provider === 'stripe' && payment.externalId) {
    const stripe = getStripe();
    if (!stripe) {
      return finalize('pending_manual', undefined, 'Stripe not configured — ops must refund manually');
    }
    try {
      const refund = await stripe.refunds.create({
        payment_intent: payment.externalId,
        amount: refundMinor,
      });
      return finalize('refunded', refund.id);
    } catch (err) {
      return finalize('failed', undefined, err instanceof Error ? err.message : 'Stripe refund failed');
    }
  }

  // Bold
  if (payment.provider === 'bold') {
    return finalize(
      'pending_manual',
      undefined,
      'Bold refund must be processed manually in dashboard.bold.co',
    );
  }

  return finalize('pending_manual', undefined, 'Unknown payment provider');
}
