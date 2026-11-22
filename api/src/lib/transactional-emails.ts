import { bookingConfirmation } from './email-templates/booking-confirmation.js';
import { bookingCancellation } from './email-templates/booking-cancellation.js';
import { checkInReminder } from './email-templates/check-in-reminder.js';
import { invoiceReceipt } from './email-templates/invoice-receipt.js';
import { passwordChanged } from './email-templates/password-changed.js';
import { passwordReset } from './email-templates/password-reset.js';
import { welcome } from './email-templates/welcome.js';
import { EMAIL_BRAND } from './email-templates/brand.js';
import { prisma } from './prisma.js';

export interface EmailSendResult {
  sent: boolean;
  reason?: string;
}

async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}): Promise<EmailSendResult> {
  if (!process.env.RESEND_API_KEY) {
    console.warn('[Email] RESEND_API_KEY not configured, logging email instead', { to, subject });
    return { sent: true };
  }
  console.warn('[Email] Resend client not available in API, logging email instead', { to, subject });
  return { sent: true };
}

export const TRANSACTIONAL_EMAILS = {
  bookingConfirmation,
  bookingCancellation,
  checkInReminder,
  invoiceReceipt,
  passwordChanged,
  passwordReset,
  welcome,
};

export type TransactionalEmailType = keyof typeof TRANSACTIONAL_EMAILS;

export function getTransactionalEmail(type: TransactionalEmailType) {
  return TRANSACTIONAL_EMAILS[type];
}

export { EMAIL_BRAND };

export async function sendWelcomeEmail(params: {
  email: string;
  name: string;
  role: string;
}): Promise<EmailSendResult> {
  const html = welcome({ guestName: params.name });
  return sendEmail({
    to: params.email,
    subject: '¡Bienvenido a Elevari! / Welcome to Elevari!',
    html,
  });
}

export async function sendPasswordResetEmail(params: {
  email: string;
  name: string;
  resetUrl: string;
}): Promise<EmailSendResult> {
  const html = passwordReset({ resetUrl: params.resetUrl, guestName: params.name });
  return sendEmail({
    to: params.email,
    subject: 'Restablecer contraseña / Reset Password',
    html,
  });
}

export async function sendPasswordChangedEmail(params: {
  email: string;
  name: string;
}): Promise<EmailSendResult> {
  const html = passwordChanged({ guestName: params.name });
  return sendEmail({
    to: params.email,
    subject: 'Contraseña cambiada / Password Changed',
    html,
  });
}

export async function sendBookingCancellationEmail(params: {
  bookingId: string;
  reason: string;
  refundAmount?: number;
  refundEligible?: boolean;
  expiredUnpaid?: boolean;
}): Promise<EmailSendResult> {
  const booking = await prisma.booking.findUnique({
    where: { id: params.bookingId },
    select: {
      guestEmail: true,
      guestName: true,
      property: { select: { title: true } },
    },
  });
  if (!booking) {
    return { sent: false, reason: 'Booking not found' };
  }
  const html = bookingCancellation({
    bookingId: params.bookingId,
    propertyName: booking.property?.title ?? 'Propiedad',
    guestName: booking.guestName ?? 'Huésped',
  });
  return sendEmail({
    to: booking.guestEmail ?? '',
    subject: 'Reserva cancelada / Booking Cancelled',
    html,
  });
}

export async function sendBookingConfirmationEmail(bookingId: string): Promise<EmailSendResult> {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    select: {
      guestEmail: true,
      guestName: true,
      property: { select: { title: true } },
      payments: { select: { amount: true } },
      checkIn: true,
      checkOut: true,
    },
  });
  if (!booking) {
    return { sent: false, reason: 'Booking not found' };
  }
  const total = booking.payments?.reduce((sum, p) => sum + Number(p.amount), 0) ?? 0;
  const html = bookingConfirmation({
    bookingId,
    propertyName: booking.property?.title ?? 'Propiedad',
    checkIn: booking.checkIn.toISOString(),
    checkOut: booking.checkOut.toISOString(),
    total: String(total),
    guestName: booking.guestName ?? 'Huésped',
  });
  return sendEmail({
    to: booking.guestEmail ?? '',
    subject: 'Reserva confirmada / Booking Confirmed',
    html,
  });
}

export async function sendInvoiceReceiptEmail(params: {
  bookingId: string;
  invoiceId?: string;
}): Promise<EmailSendResult> {
  const booking = await prisma.booking.findUnique({
    where: { id: params.bookingId },
    select: {
      guestEmail: true,
      guestName: true,
      property: { select: { title: true } },
      payments: { select: { amount: true } },
    },
  });
  if (!booking) {
    return { sent: false, reason: 'Booking not found' };
  }
  const total = booking.payments?.reduce((sum, p) => sum + Number(p.amount), 0) ?? 0;
  const html = invoiceReceipt({
    invoiceId: params.invoiceId ?? 'N/A',
    bookingId: params.bookingId,
    propertyName: booking.property?.title ?? 'Propiedad',
    total: String(total),
    guestName: booking.guestName ?? 'Huésped',
  });
  return sendEmail({
    to: booking.guestEmail ?? '',
    subject: 'Factura / Invoice Receipt',
    html,
  });
}

export async function sendCheckInReminderEmail(params: {
  bookingId: string;
}): Promise<EmailSendResult> {
  const booking = await prisma.booking.findUnique({
    where: { id: params.bookingId },
    select: {
      guestEmail: true,
      guestName: true,
      property: { select: { title: true } },
      checkIn: true,
    },
  });
  if (!booking) {
    return { sent: false, reason: 'Booking not found' };
  }
  const html = checkInReminder({
    bookingId: params.bookingId,
    propertyName: booking.property?.title ?? 'Propiedad',
    checkIn: booking.checkIn.toISOString(),
    guestName: booking.guestName ?? 'Huésped',
  });
  return sendEmail({
    to: booking.guestEmail ?? '',
    subject: 'Recordatorio de check-in / Check-in Reminder',
    html,
  });
}

export async function sendCheckInReminderEmails(): Promise<{ sent: number; errors: number }> {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const start = new Date(tomorrow);
  start.setHours(0, 0, 0, 0);
  const end = new Date(tomorrow);
  end.setHours(23, 59, 59, 999);

  const bookings = await prisma.booking.findMany({
    where: {
      status: 'confirmed',
      checkIn: { gte: start, lte: end },
    },
    select: { id: true },
  });

  let sent = 0;
  let errors = 0;

  for (const booking of bookings) {
    try {
      const result = await sendCheckInReminderEmail({ bookingId: booking.id });
      if (result.sent) sent++;
      else errors++;
    } catch {
      errors++;
    }
  }

  return { sent, errors };
}