import type { FastifyInstance } from 'fastify';
import { prisma } from '../lib/prisma.js';
import { authenticate } from '../plugins/auth.js';
import { fromMinorUnits } from '../lib/payments/money.js';

const PAYMENT_STATUSES_SHOWN = ['processing', 'succeeded', 'failed', 'partially_refunded', 'refunded'] as const;
// Refunds that are committed (paid out, or approved and waiting for a manual transfer).
const REFUND_STATUSES_COUNTED = ['refunded', 'pending_manual'];

function invoiceTotal(invoiceData: unknown): number | null {
  if (!invoiceData || typeof invoiceData !== 'object') return null;
  const data = invoiceData as { total_charge_to_guest?: unknown; total_amount?: unknown };
  const total = data.total_charge_to_guest ?? data.total_amount;
  return typeof total === 'number' && Number.isFinite(total) ? total : null;
}

export async function accountRoutes(app: FastifyInstance) {
  /** Payment history and invoices for the signed-in guest. */
  app.get('/account/billing', { preHandler: authenticate }, async (request) => {
    const userId = request.auth!.sub;

    const [payments, pendingInvoices] = await Promise.all([
      prisma.payment.findMany({
        where: { booking: { guestId: userId }, status: { in: [...PAYMENT_STATUSES_SHOWN] } },
        orderBy: { createdAt: 'desc' },
        take: 100,
        select: {
          id: true,
          bookingId: true,
          provider: true,
          amount: true,
          currency: true,
          status: true,
          createdAt: true,
          booking: { select: { property: { select: { title: true } } } },
          refunds: {
            where: { status: { in: REFUND_STATUSES_COUNTED } },
            select: { amountMinor: true },
          },
        },
      }),
      prisma.pendingInvoice.findMany({
        where: { booking: { guestId: userId } },
        orderBy: { createdAt: 'desc' },
        take: 200,
        select: {
          id: true,
          bookingId: true,
          status: true,
          alegraInvoiceId: true,
          invoiceData: true,
          createdAt: true,
          booking: { select: { property: { select: { title: true } } } },
        },
      }),
    ]);

    // One invoice per booking: the issued one if there is any, otherwise the most recent attempt.
    const invoiceByBooking = new Map<string, (typeof pendingInvoices)[number]>();
    for (const invoice of pendingInvoices) {
      const current = invoiceByBooking.get(invoice.bookingId);
      if (!current || (current.status !== 'issued' && invoice.status === 'issued')) {
        invoiceByBooking.set(invoice.bookingId, invoice);
      }
    }

    return {
      payments: payments.map((payment) => ({
        id: payment.id,
        booking_id: payment.bookingId,
        property_title: payment.booking.property.title,
        amount: Number(payment.amount),
        currency: payment.currency,
        status: payment.status,
        provider: payment.provider,
        refunded_amount: fromMinorUnits(
          payment.refunds.reduce((sum, refund) => sum + refund.amountMinor, 0),
        ),
        created_at: payment.createdAt.toISOString(),
      })),
      invoices: [...invoiceByBooking.values()].map((invoice) => ({
        id: invoice.id,
        booking_id: invoice.bookingId,
        property_title: invoice.booking.property.title,
        invoice_number: invoice.status === 'issued' ? invoice.alegraInvoiceId : null,
        // A failed attempt is retried by our team; to the guest it is simply not issued yet.
        status: invoice.status === 'issued' ? 'issued' : 'pending',
        total: invoiceTotal(invoice.invoiceData),
        currency: 'COP',
        created_at: invoice.createdAt.toISOString(),
      })),
    };
  });
}
