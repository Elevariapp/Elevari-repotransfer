import { prisma } from './prisma.js';
import { sendEmail } from './email.js';
import {
  buildBookingConfirmationEmail,
  buildBookingCancellationEmail,
  buildCheckInReminderEmail,
  buildInvoiceReceiptEmail,
  buildPasswordChangedEmail,
  buildPasswordResetEmail,
  buildWelcomeEmail,
} from './email-templates/index.js';
import type { WanaFees } from './fees.js';

function skipDemoEmail(email: string): boolean {
  return email.trim().toLowerCase().endsWith('@wana.local');
}

export async function sendBookingConfirmationEmail(bookingId: string): Promise<void> {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      property: { select: { title: true, slug: true, city: true } },
    },
  });

  if (!booking?.guestEmail || skipDemoEmail(booking.guestEmail)) return;

  const fees = booking.feesBreakdown as WanaFees | null;
  const { subject, text, html } = buildBookingConfirmationEmail({
    guestName: booking.guestName,
    propertyTitle: booking.property.title,
    propertySlug: booking.property.slug,
    city: booking.property.city,
    checkIn: booking.checkIn.toISOString().slice(0, 10),
    checkOut: booking.checkOut.toISOString().slice(0, 10),
    guests: booking.guests,
    nights: fees?.nights ?? 1,
    totalCharge: fees?.total_charge_to_guest,
    bookingId: booking.id,
  });

  await sendEmail({ to: booking.guestEmail, subject, text, html });
}

export async function sendInvoiceReceiptEmail(params: {
  bookingId: string;
  invoiceId?: string;
}): Promise<{ sent: boolean; reason?: string }> {
  const booking = await prisma.booking.findUnique({
    where: { id: params.bookingId },
    include: { property: { select: { title: true } } },
  });

  if (!booking?.guestEmail || skipDemoEmail(booking.guestEmail)) {
    return { sent: false, reason: 'no guest email' };
  }

  const fees = booking.feesBreakdown as WanaFees | null;
  if (!fees?.total_charge_to_guest) {
    return { sent: false, reason: 'no fees breakdown' };
  }

  // MVP pricing: no tax lines — only the Elevari service fee.
  const taxesAndFees = fees.platform_fee_amount ?? 0;

  const { subject, text, html } = buildInvoiceReceiptEmail({
    guestName: booking.guestName,
    guestEmail: booking.guestEmail,
    propertyTitle: booking.property.title,
    checkIn: booking.checkIn.toISOString().slice(0, 10),
    checkOut: booking.checkOut.toISOString().slice(0, 10),
    nights: fees.nights ?? 1,
    subtotal: fees.subtotal,
    taxesAndFees,
    totalCharge: fees.total_charge_to_guest,
    invoiceId: params.invoiceId ?? booking.invoiceId ?? undefined,
    bookingId: booking.id,
  });

  return sendEmail({ to: booking.guestEmail, subject, text, html });
}

export async function sendWelcomeEmail(params: {
  email: string;
  name: string | null;
  role: 'guest' | 'host' | 'admin';
}): Promise<{ sent: boolean; reason?: string }> {
  if (skipDemoEmail(params.email)) {
    return { sent: false, reason: 'demo account skipped' };
  }

  const { subject, text, html } = buildWelcomeEmail(params);
  return sendEmail({ to: params.email, subject, text, html });
}

export async function sendPasswordResetEmail(params: {
  email: string;
  name: string | null;
  resetUrl: string;
}): Promise<{ sent: boolean; reason?: string }> {
  if (skipDemoEmail(params.email)) {
    return { sent: false, reason: 'demo account skipped' };
  }

  const { subject, text, html } = buildPasswordResetEmail({
    name: params.name,
    resetUrl: params.resetUrl,
  });
  return sendEmail({ to: params.email, subject, text, html });
}

export async function sendPasswordChangedEmail(params: {
  email: string;
  name: string | null;
}): Promise<{ sent: boolean; reason?: string }> {
  if (skipDemoEmail(params.email)) {
    return { sent: false, reason: 'demo account skipped' };
  }

  const { subject, text, html } = buildPasswordChangedEmail(params);
  return sendEmail({ to: params.email, subject, text, html });
}

function utcDateOnlyString(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function tomorrowUtc(from = new Date()): string {
  const d = new Date(
    Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), from.getUTCDate() + 1),
  );
  return utcDateOnlyString(d);
}

export async function sendBookingCancellationEmail(params: {
  bookingId: string;
  reason: string;
  refundAmount?: number;
  refundEligible?: boolean;
  expiredUnpaid?: boolean;
}): Promise<{ sent: boolean; reason?: string }> {
  const booking = await prisma.booking.findUnique({
    where: { id: params.bookingId },
    include: { property: { select: { title: true, slug: true, city: true } } },
  });

  if (!booking?.guestEmail || skipDemoEmail(booking.guestEmail)) {
    return { sent: false, reason: 'no guest email' };
  }

  const { subject, text, html } = buildBookingCancellationEmail({
    guestName: booking.guestName,
    propertyTitle: booking.property.title,
    propertySlug: booking.property.slug,
    city: booking.property.city,
    checkIn: booking.checkIn.toISOString().slice(0, 10),
    checkOut: booking.checkOut.toISOString().slice(0, 10),
    guests: booking.guests,
    reason: params.reason,
    refundAmount: params.refundAmount,
    refundEligible: params.refundEligible,
    expiredUnpaid: params.expiredUnpaid,
  });

  return sendEmail({ to: booking.guestEmail, subject, text, html });
}

export async function sendCheckInReminderEmail(bookingId: string): Promise<{ sent: boolean; reason?: string }> {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: { property: { select: { title: true, slug: true, city: true } } },
  });

  if (!booking?.guestEmail || skipDemoEmail(booking.guestEmail)) {
    return { sent: false, reason: 'no guest email' };
  }

  if (booking.status !== 'confirmed') {
    return { sent: false, reason: 'booking not confirmed' };
  }

  const fees = booking.feesBreakdown as WanaFees | null;
  const { subject, text, html } = buildCheckInReminderEmail({
    guestName: booking.guestName,
    propertyTitle: booking.property.title,
    propertySlug: booking.property.slug,
    city: booking.property.city,
    checkIn: booking.checkIn.toISOString().slice(0, 10),
    checkOut: booking.checkOut.toISOString().slice(0, 10),
    guests: booking.guests,
    nights: fees?.nights ?? 1,
    bookingId: booking.id,
  });

  const result = await sendEmail({ to: booking.guestEmail, subject, text, html });
  if (result.sent) {
    await prisma.bookingEvent.create({
      data: {
        bookingId: booking.id,
        fromStatus: 'confirmed',
        toStatus: 'confirmed',
        metadata: {
          type: 'check_in_reminder_sent',
          sent_at: new Date().toISOString(),
        },
      },
    });
  }

  return result;
}

/** Sends reminders for confirmed bookings checking in tomorrow (UTC date). */
export async function sendCheckInReminderEmails(): Promise<{
  sent: number;
  skipped: number;
  errors: number;
}> {
  const targetCheckIn = tomorrowUtc();
  const checkInDate = new Date(`${targetCheckIn}T00:00:00.000Z`);

  const bookings = await prisma.booking.findMany({
    where: {
      status: 'confirmed',
      checkIn: checkInDate,
      guestEmail: { not: null },
      NOT: {
        events: {
          some: {
            metadata: {
              path: ['type'],
              equals: 'check_in_reminder_sent',
            },
          },
        },
      },
    },
    select: { id: true },
  });

  let sent = 0;
  let skipped = 0;
  let errors = 0;

  for (const { id } of bookings) {
    try {
      const result = await sendCheckInReminderEmail(id);
      if (result.sent) sent += 1;
      else skipped += 1;
    } catch {
      errors += 1;
    }
  }

  return { sent, skipped, errors };
}
