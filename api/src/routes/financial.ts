import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { authenticate, requireRoles } from '../plugins/auth.js';
import {
  buildReconciliationReport,
  reconcilePayment,
  type BookingLike,
  type PaymentLike,
} from '../lib/reconciliation.js';
import { buildTransactionTimeline } from '../lib/audit-trail.js';

const WINDOW = 500;

function toPaymentLike(payment: {
  id: string;
  bookingId: string;
  status: string;
  amount: unknown;
  currency: string;
  provider: string;
  externalId: string | null;
  metadata: unknown;
}): PaymentLike {
  return {
    id: payment.id,
    bookingId: payment.bookingId,
    status: payment.status,
    amount: Number(payment.amount),
    currency: payment.currency,
    provider: payment.provider,
    externalId: payment.externalId,
    metadata: (payment.metadata ?? null) as Record<string, unknown> | null,
  };
}

export async function financialRoutes(app: FastifyInstance) {
  /**
   * Reconciliation report (Wave 2, Objective 1).
   * Classifies every payment in the recent window and lists anomalies.
   */
  app.get(
    '/admin/reconciliation',
    { preHandler: [authenticate, requireRoles(['admin'])] },
    async () => {
      const [payments, bookings] = await Promise.all([
        prisma.payment.findMany({ orderBy: { createdAt: 'desc' }, take: WINDOW }),
        prisma.booking.findMany({
          orderBy: { createdAt: 'desc' },
          take: WINDOW,
          select: { id: true, status: true },
        }),
      ]);

      const report = buildReconciliationReport(
        payments.map(toPaymentLike),
        bookings as BookingLike[],
      );

      return { ...report, window: { payments: WINDOW, bookings: WINDOW } };
    },
  );

  /**
   * Auditable transaction timeline (Wave 2, Objective 2).
   * Reconstructs booking events, payment events and refunds for one booking.
   */
  app.get(
    '/admin/audit/transactions/:bookingId',
    { preHandler: [authenticate, requireRoles(['admin'])] },
    async (request, reply) => {
      const parsed = z.object({ bookingId: z.string().uuid() }).safeParse(request.params);
      if (!parsed.success) {
        return reply.status(400).send({ error: 'Invalid booking id' });
      }
      const { bookingId } = parsed.data;

      const booking = await prisma.booking.findUnique({
        where: { id: bookingId },
        select: { id: true, status: true },
      });
      if (!booking) {
        return reply.status(404).send({ error: 'Booking not found' });
      }

      const [bookingEvents, payments, paymentEvents] = await Promise.all([
        prisma.bookingEvent.findMany({ where: { bookingId }, orderBy: { createdAt: 'asc' } }),
        prisma.payment.findMany({ where: { bookingId }, orderBy: { createdAt: 'asc' } }),
        prisma.paymentEvent.findMany({ where: { bookingId }, orderBy: { createdAt: 'asc' } }),
      ]);

      const refunds =
        payments.length > 0
          ? await prisma.paymentRefund.findMany({
              where: { paymentId: { in: payments.map((p) => p.id) } },
              orderBy: { createdAt: 'asc' },
            })
          : [];

      const timeline = buildTransactionTimeline({
        bookingEvents: bookingEvents.map((e) => ({
          at: e.createdAt.toISOString(),
          type: e.toStatus,
          from: e.fromStatus,
          to: e.toStatus,
        })),
        paymentEvents: paymentEvents.map((e) => ({
          at: e.createdAt.toISOString(),
          type: e.type,
          payload: (e.payload ?? null) as Record<string, unknown> | null,
        })),
        refunds: refunds.map((r) => ({
          at: r.createdAt.toISOString(),
          status: r.status,
          amountMinor: r.amountMinor,
        })),
        paymentStatuses: payments.map((p) => p.status),
      });

      const bookingLike: BookingLike = { id: booking.id, status: booking.status };
      const reconciliation = payments.map((p) => reconcilePayment(toPaymentLike(p), bookingLike));

      return {
        booking_id: booking.id,
        booking_status: booking.status,
        timeline,
        reconciliation,
      };
    },
  );
}
