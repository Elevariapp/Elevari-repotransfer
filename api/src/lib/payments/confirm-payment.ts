import { prisma } from '../prisma.js';
import { assertTransition } from '../booking-state.js';
import { onBookingConfirmed } from '../marketing.js';
import { assertPaymentTransition } from './payment-state.js';
import { recordPaymentEvent, newCorrelationId } from './events.js';

export async function confirmPaymentSuccess(params: {
  paymentId: string;
  externalId: string;
  raw?: unknown;
}): Promise<{
  bookingId: string;
  alreadyProcessed: boolean;
  refundRequired?: boolean;
}> {
  const { paymentId, externalId, raw } = params;

  const result = await prisma.$transaction(async (tx) => {
    const payment = await tx.payment.findUnique({ where: { id: paymentId } });
    if (!payment) {
      throw new Error('PAYMENT_NOT_FOUND');
    }

    if (payment.status === 'succeeded') {
      return {
        bookingId: payment.bookingId,
        alreadyProcessed: true,
        newlyConfirmed: false,
        refundRequired: false,
      };
    }

    const booking = await tx.booking.findUnique({ where: { id: payment.bookingId } });
    if (!booking) {
      throw new Error('BOOKING_NOT_FOUND');
    }

    const existingMeta =
      payment.metadata && typeof payment.metadata === 'object'
        ? (payment.metadata as Record<string, unknown>)
        : {};

    if (booking.status === 'cancelled') {
      assertPaymentTransition(payment.status, 'succeeded');
      await tx.payment.update({
        where: { id: paymentId },
        data: {
          status: 'succeeded',
          externalId,
          metadata: {
            ...existingMeta,
            ...(raw ? { webhook_raw: raw } : {}),
            refund_required: true,
            confirmed_after_cancel: true,
          },
        },
      });

      await tx.paymentAttempt.create({
        data: {
          paymentId,
          status: 'succeeded',
          error: 'Booking was cancelled before payment confirmation',
          raw: raw ? (raw as object) : undefined,
        },
      });

      await tx.bookingEvent.create({
        data: {
          bookingId: booking.id,
          fromStatus: 'cancelled',
          toStatus: 'cancelled',
          metadata: { paymentId, externalId, refund_required: true },
        },
      });

      return {
        bookingId: booking.id,
        alreadyProcessed: false,
        newlyConfirmed: false,
        refundRequired: true,
      };
    }

    if (booking.status !== 'pending_payment') {
      assertPaymentTransition(payment.status, 'succeeded');
      await tx.payment.update({
        where: { id: paymentId },
        data: {
          status: 'succeeded',
          externalId,
          metadata: raw ? (raw as object) : undefined,
        },
      });

      await tx.paymentAttempt.create({
        data: {
          paymentId,
          status: 'succeeded',
          raw: raw ? (raw as object) : undefined,
        },
      });

      return {
        bookingId: booking.id,
        alreadyProcessed: false,
        newlyConfirmed: false,
        refundRequired: false,
      };
    }

    assertPaymentTransition(payment.status, 'succeeded');
    await tx.payment.update({
      where: { id: paymentId },
      data: {
        status: 'succeeded',
        externalId,
        metadata: raw ? (raw as object) : undefined,
      },
    });

    await tx.paymentAttempt.create({
      data: {
        paymentId,
        status: 'succeeded',
        raw: raw ? (raw as object) : undefined,
      },
    });

    assertTransition(booking.status, 'confirmed');
    await tx.booking.update({
      where: { id: booking.id },
      data: { status: 'confirmed' },
    });
    await tx.bookingEvent.create({
      data: {
        bookingId: booking.id,
        fromStatus: 'pending_payment',
        toStatus: 'confirmed',
        metadata: { paymentId, externalId },
      },
    });

    return {
      bookingId: booking.id,
      alreadyProcessed: false,
      newlyConfirmed: true,
      refundRequired: false,
    };
  });

  if (!result.alreadyProcessed && result.newlyConfirmed) {
    void onBookingConfirmed(result.bookingId);
  }

  return {
    bookingId: result.bookingId,
    alreadyProcessed: result.alreadyProcessed,
    refundRequired: result.refundRequired,
  };
}

export async function markPaymentFailed(paymentId: string, error: string, raw?: unknown) {
  await prisma.$transaction(async (tx) => {
    const payment = await tx.payment.findUnique({ where: { id: paymentId } });
    if (!payment) throw new Error('PAYMENT_NOT_FOUND');
    // FAILED never confirms a booking; booking stays in its current status.
    assertPaymentTransition(payment.status, 'failed');
    await tx.payment.update({
      where: { id: paymentId },
      data: { status: 'failed' },
    });
    await tx.paymentAttempt.create({
      data: {
        paymentId,
        status: 'failed',
        error,
        raw: raw ? (raw as object) : undefined,
      },
    });
  });

  const payment = await prisma.payment.findUnique({ where: { id: paymentId } });
  await recordPaymentEvent({
    type: 'payment_failed',
    correlationId: newCorrelationId(),
    paymentId,
    bookingId: payment?.bookingId,
    payload: { error },
  });
}
