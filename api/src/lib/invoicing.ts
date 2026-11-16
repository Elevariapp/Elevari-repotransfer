import { prisma } from './prisma.js';
import { nightsBetween, type WanaFees } from './fees.js';
import { buildAlegraInvoicePayload, createAlegraInvoice, getAlegraClient } from './alegra.js';
import { sendInvoiceReceiptEmail } from './transactional-emails.js';

export async function issueBookingInvoice(bookingId: string): Promise<void> {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      property: { select: { title: true } },
      payments: { where: { status: 'succeeded' }, orderBy: { createdAt: 'desc' }, take: 1 },
    },
  });

  if (!booking) return;
  if (booking.invoiceId) return;

  const payment = booking.payments[0];
  if (payment?.currency === 'USD') {
    return;
  }

  const fees = booking.feesBreakdown as WanaFees | null;
  if (!fees) {
    console.warn('[invoicing] No fees breakdown for booking', bookingId);
    return;
  }

  const nights = fees.nights ?? nightsBetween(booking.checkIn, booking.checkOut);
  const guestEmail = booking.guestEmail ?? '';
  const guestName = booking.guestName ?? 'Huésped Wana';
  const transactionId = payment?.externalId ?? payment?.id ?? bookingId;

  const payload = buildAlegraInvoicePayload({
    guestName,
    guestEmail,
    propertyTitle: booking.property.title,
    nights,
    fees,
    transactionId,
  });

  const alegraClient = getAlegraClient();

  if (!alegraClient) {
    await storePendingInvoice({
      bookingId,
      transactionId,
      invoiceData: fees,
      guestEmail,
      guestName,
      error: 'Alegra credentials not configured',
    });
    await sendInvoiceReceiptEmail({ bookingId }).catch((err) => {
      console.error('[invoicing] Invoice receipt email failed', { bookingId, err });
    });
    return;
  }

  try {
    const invoice = await createAlegraInvoice(payload);

    await prisma.$transaction([
      prisma.booking.update({
        where: { id: bookingId },
        data: { invoiceId: String(invoice.id) },
      }),
      prisma.pendingInvoice.create({
        data: {
          bookingId,
          transactionId,
          invoiceData: fees as object,
          guestEmail,
          guestName,
          status: 'issued',
          alegraInvoiceId: String(invoice.id),
        },
      }),
    ]);

    console.log('[invoicing] Alegra invoice issued', { bookingId, invoiceId: invoice.id });

    sendInvoiceReceiptEmail({ bookingId, invoiceId: String(invoice.id) }).catch((err) => {
      console.error('[invoicing] Invoice receipt email failed', { bookingId, err });
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[invoicing] Alegra failed', { bookingId, error: message });

    await storePendingInvoice({
      bookingId,
      transactionId,
      invoiceData: fees,
      guestEmail,
      guestName,
      error: message,
    });

    await sendInvoiceReceiptEmail({ bookingId }).catch((err) => {
      console.error('[invoicing] Invoice receipt email failed', { bookingId, err });
    });
  }
}

async function storePendingInvoice(params: {
  bookingId: string;
  transactionId: string;
  invoiceData: WanaFees;
  guestEmail: string;
  guestName: string;
  error?: string;
}) {
  await prisma.pendingInvoice.create({
    data: {
      bookingId: params.bookingId,
      transactionId: params.transactionId,
      invoiceData: params.invoiceData as object,
      guestEmail: params.guestEmail,
      guestName: params.guestName,
      status: 'failed',
      alegraError: params.error,
    },
  });
}

export async function retryPendingInvoice(pendingInvoiceId: string): Promise<boolean> {
  const pending = await prisma.pendingInvoice.findUnique({
    where: { id: pendingInvoiceId },
    include: {
      booking: {
        include: {
          property: { select: { title: true } },
          payments: { where: { status: 'succeeded' }, take: 1 },
        },
      },
    },
  });

  if (!pending || pending.status === 'issued') return false;

  const fees = pending.invoiceData as unknown as WanaFees;
  const nights = fees.nights ?? nightsBetween(pending.booking.checkIn, pending.booking.checkOut);
  const transactionId = pending.transactionId ?? pending.bookingId;

  const payload = buildAlegraInvoicePayload({
    guestName: pending.guestName ?? 'Huésped Wana',
    guestEmail: pending.guestEmail ?? '',
    propertyTitle: pending.booking.property.title,
    nights,
    fees,
    transactionId,
  });

  try {
    const invoice = await createAlegraInvoice(payload);

    await prisma.$transaction([
      prisma.booking.update({
        where: { id: pending.bookingId },
        data: { invoiceId: String(invoice.id) },
      }),
      prisma.pendingInvoice.update({
        where: { id: pendingInvoiceId },
        data: {
          status: 'issued',
          alegraInvoiceId: String(invoice.id),
          alegraError: null,
        },
      }),
    ]);

    sendInvoiceReceiptEmail({
      bookingId: pending.bookingId,
      invoiceId: String(invoice.id),
    }).catch((err) => {
      console.error('[invoicing] Invoice receipt email failed', { bookingId: pending.bookingId, err });
    });

    return true;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await prisma.pendingInvoice.update({
      where: { id: pendingInvoiceId },
      data: { alegraError: message, status: 'failed' },
    });
    return false;
  }
}
