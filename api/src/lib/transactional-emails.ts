import { accountDeleted } from './email-templates/account-deleted.js';
import { bookingCancellation } from './email-templates/booking-cancellation.js';
import { bookingConfirmation } from './email-templates/booking-confirmation.js';
import { checkInReminder } from './email-templates/check-in-reminder.js';
import { hostBookingCancelled } from './email-templates/host-booking-cancelled.js';
import { hostNewBooking } from './email-templates/host-new-booking.js';
import { invoiceReceipt } from './email-templates/invoice-receipt.js';
import { passwordChanged } from './email-templates/password-changed.js';
import { passwordReset } from './email-templates/password-reset.js';
import { welcome } from './email-templates/welcome.js';
import { EMAIL_BRAND } from './email-templates/brand.js';
import { deliverEmail, siteUrl, type EmailSendResult } from './email.js';
import type { WanaFees } from './fees.js';
import { guestDisplayName } from './guest-name.js';
import { resolveNotificationPreferences } from './notification-prefs.js';
import { prisma } from './prisma.js';

export type { EmailSendResult };

export const TRANSACTIONAL_EMAILS = {
  accountDeleted,
  bookingCancellation,
  bookingConfirmation,
  checkInReminder,
  hostBookingCancelled,
  hostNewBooking,
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

const SUBJECT_TITLE_MAX = 60;

function subjectWithProperty(prefix: string, propertyName: string): string {
  const title = propertyName.length > SUBJECT_TITLE_MAX ? `${propertyName.slice(0, SUBJECT_TITLE_MAX - 1)}…` : propertyName;
  return `${prefix} · ${title}`;
}

type AccountRecipient = { email: string; name: string | null; deletedAt: Date | null };

function guestRecipient(booking: {
  guestEmail: string | null;
  guestName: string | null;
  guest: AccountRecipient | null;
}): { email: string; name: string | null } | null {
  if (booking.guest?.deletedAt) return null;
  const email = booking.guestEmail?.trim() || booking.guest?.email.trim();
  if (!email) return null;
  return { email, name: guestDisplayName(booking) };
}

async function loadBooking(bookingId: string) {
  return prisma.booking.findUnique({
    where: { id: bookingId },
    select: {
      id: true,
      checkIn: true,
      checkOut: true,
      guests: true,
      guestEmail: true,
      guestName: true,
      feesBreakdown: true,
      guest: { select: { email: true, name: true, deletedAt: true, notificationPrefs: true } },
      property: {
        select: {
          title: true,
          host: { select: { email: true, name: true, deletedAt: true, notificationPrefs: true } },
        },
      },
      payments: {
        where: { status: { in: ['succeeded', 'partially_refunded', 'refunded'] } },
        orderBy: { createdAt: 'desc' },
        take: 1,
        select: { amount: true, currency: true },
      },
    },
  });
}

type LoadedBooking = NonNullable<Awaited<ReturnType<typeof loadBooking>>>;

/** What the guest actually paid: the succeeded payment, else the fee breakdown (COP). Failed attempts never count. */
function paidTotal(booking: LoadedBooking): { total: number | null; currency: string } {
  const payment = booking.payments[0];
  if (payment) return { total: Number(payment.amount), currency: payment.currency };
  const fees = booking.feesBreakdown as Partial<WanaFees> | null;
  const total = fees?.total_charge_to_guest;
  return { total: typeof total === 'number' ? total : null, currency: 'COP' };
}

export async function sendWelcomeEmail(params: {
  email: string;
  name: string;
  role: string;
}): Promise<EmailSendResult> {
  const isHost = params.role === 'host';
  return deliverEmail({
    to: params.email,
    subject: '¡Bienvenido a Elevari! / Welcome to Elevari!',
    html: welcome({
      guestName: params.name,
      isHost,
      ctaUrl: siteUrl(isHost ? '/host' : '/properties'),
    }),
  });
}

export async function sendPasswordResetEmail(params: {
  email: string;
  name: string;
  resetUrl: string;
}): Promise<EmailSendResult> {
  return deliverEmail({
    to: params.email,
    subject: 'Restablecer contraseña / Reset password',
    html: passwordReset({ resetUrl: params.resetUrl, guestName: params.name }),
  });
}

export async function sendPasswordChangedEmail(params: {
  email: string;
  name: string;
}): Promise<EmailSendResult> {
  return deliverEmail({
    to: params.email,
    subject: 'Tu contraseña fue cambiada / Your password was changed',
    html: passwordChanged({
      guestName: params.name,
      changedAt: new Date(),
      secureUrl: siteUrl('/auth/forgot-password'),
    }),
  });
}

export async function sendAccountDeletedEmail(params: {
  email: string;
  name: string | null;
}): Promise<EmailSendResult> {
  return deliverEmail({
    to: params.email,
    subject: 'Tu cuenta fue eliminada / Your account was deleted',
    html: accountDeleted({ guestName: params.name }),
  });
}

export async function sendBookingCancellationEmail(params: {
  bookingId: string;
  reason: string;
  refundAmount?: number;
  refundEligible?: boolean;
  expiredUnpaid?: boolean;
}): Promise<EmailSendResult> {
  const booking = await loadBooking(params.bookingId);
  if (!booking) return { sent: false, reason: 'booking_not_found' };
  const recipient = guestRecipient(booking);
  if (!recipient) return { sent: false, reason: 'no_recipient' };

  return deliverEmail({
    to: recipient.email,
    subject: subjectWithProperty(
      params.expiredUnpaid ? 'Reserva expirada / Booking expired' : 'Reserva cancelada / Booking cancelled',
      booking.property.title,
    ),
    idempotencyKey: `booking-cancelled/${booking.id}`,
    html: bookingCancellation({
      bookingId: booking.id,
      propertyName: booking.property.title,
      guestName: recipient.name,
      reason: params.reason,
      refundAmount: params.refundAmount,
      refundEligible: params.refundEligible,
      expiredUnpaid: params.expiredUnpaid,
      exploreUrl: siteUrl('/properties'),
    }),
  });
}

export async function sendBookingConfirmationEmail(bookingId: string): Promise<EmailSendResult> {
  const booking = await loadBooking(bookingId);
  if (!booking) return { sent: false, reason: 'booking_not_found' };
  const recipient = guestRecipient(booking);
  if (!recipient) return { sent: false, reason: 'no_recipient' };

  const { total, currency } = paidTotal(booking);
  return deliverEmail({
    to: recipient.email,
    subject: subjectWithProperty('Reserva confirmada / Booking confirmed', booking.property.title),
    idempotencyKey: `booking-confirmation/${booking.id}`,
    html: bookingConfirmation({
      bookingId: booking.id,
      propertyName: booking.property.title,
      checkIn: booking.checkIn,
      checkOut: booking.checkOut,
      guests: booking.guests,
      total,
      currency,
      guestName: recipient.name,
      bookingUrl: siteUrl('/account'),
    }),
  });
}

export async function sendInvoiceReceiptEmail(params: {
  bookingId: string;
  invoiceId?: string;
}): Promise<EmailSendResult> {
  const booking = await loadBooking(params.bookingId);
  if (!booking) return { sent: false, reason: 'booking_not_found' };
  const recipient = guestRecipient(booking);
  if (!recipient) return { sent: false, reason: 'no_recipient' };

  const { total, currency } = paidTotal(booking);
  return deliverEmail({
    to: recipient.email,
    subject: params.invoiceId
      ? subjectWithProperty('Tu factura está lista / Your invoice is ready', booking.property.title)
      : subjectWithProperty('Recibo de pago / Payment receipt', booking.property.title),
    idempotencyKey: `invoice-receipt/${booking.id}/${params.invoiceId ?? 'pending'}`,
    html: invoiceReceipt({
      invoiceId: params.invoiceId,
      bookingId: booking.id,
      propertyName: booking.property.title,
      total,
      currency,
      guestName: recipient.name,
      billingUrl: siteUrl('/account/billing'),
    }),
  });
}

export async function sendCheckInReminderEmail(params: {
  bookingId: string;
}): Promise<EmailSendResult> {
  const booking = await loadBooking(params.bookingId);
  if (!booking) return { sent: false, reason: 'booking_not_found' };
  const recipient = guestRecipient(booking);
  if (!recipient) return { sent: false, reason: 'no_recipient' };
  if (!resolveNotificationPreferences(booking.guest?.notificationPrefs).email.reminders) {
    return { sent: false, reason: 'opted_out' };
  }

  return deliverEmail({
    to: recipient.email,
    subject: subjectWithProperty('Tu check-in es mañana / Your check-in is tomorrow', booking.property.title),
    idempotencyKey: `check-in-reminder/${booking.id}`,
    html: checkInReminder({
      bookingId: booking.id,
      propertyName: booking.property.title,
      checkIn: booking.checkIn,
      guestName: recipient.name,
      bookingUrl: siteUrl('/account'),
      preferencesUrl: siteUrl('/account/notifications'),
    }),
  });
}

function hostRecipient(booking: LoadedBooking): { email: string; name: string | null } | null {
  const host = booking.property.host;
  if (host.deletedAt || !host.email.trim()) return null;
  return { email: host.email.trim(), name: host.name?.trim() || null };
}

function hostWantsBookingEmails(booking: LoadedBooking): boolean {
  return resolveNotificationPreferences(booking.property.host.notificationPrefs).email.host_bookings;
}

export async function sendHostNewBookingEmail(bookingId: string): Promise<EmailSendResult> {
  const booking = await loadBooking(bookingId);
  if (!booking) return { sent: false, reason: 'booking_not_found' };
  const host = hostRecipient(booking);
  if (!host) return { sent: false, reason: 'no_recipient' };
  if (!hostWantsBookingEmails(booking)) return { sent: false, reason: 'opted_out' };

  const fees = booking.feesBreakdown as Partial<WanaFees> | null;
  return deliverEmail({
    to: host.email,
    subject: subjectWithProperty('Nueva reserva / New booking', booking.property.title),
    idempotencyKey: `host-new-booking/${booking.id}`,
    html: hostNewBooking({
      hostName: host.name,
      bookingId: booking.id,
      propertyName: booking.property.title,
      guestName: guestDisplayName(booking),
      checkIn: booking.checkIn,
      checkOut: booking.checkOut,
      guests: booking.guests,
      hostReceives: typeof fees?.host_receives === 'number' ? fees.host_receives : null,
      dashboardUrl: siteUrl('/host'),
      preferencesUrl: siteUrl('/account/notifications'),
    }),
  });
}

export async function sendHostBookingCancelledEmail(bookingId: string): Promise<EmailSendResult> {
  const booking = await loadBooking(bookingId);
  if (!booking) return { sent: false, reason: 'booking_not_found' };
  const host = hostRecipient(booking);
  if (!host) return { sent: false, reason: 'no_recipient' };
  if (!hostWantsBookingEmails(booking)) return { sent: false, reason: 'opted_out' };

  return deliverEmail({
    to: host.email,
    subject: subjectWithProperty('Reserva cancelada / Booking cancelled', booking.property.title),
    idempotencyKey: `host-booking-cancelled/${booking.id}`,
    html: hostBookingCancelled({
      hostName: host.name,
      bookingId: booking.id,
      propertyName: booking.property.title,
      guestName: guestDisplayName(booking),
      checkIn: booking.checkIn,
      checkOut: booking.checkOut,
      dashboardUrl: siteUrl('/host'),
      preferencesUrl: siteUrl('/account/notifications'),
    }),
  });
}

const COLOMBIA_UTC_OFFSET_MS = -5 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

/** Check-in dates are calendar dates (UTC midnight); "tomorrow" is decided in Colombian time. */
export function tomorrowDateRangeUtc(now: Date = new Date()): { start: Date; end: Date } {
  const colombiaNow = new Date(now.getTime() + COLOMBIA_UTC_OFFSET_MS);
  const start = Date.UTC(colombiaNow.getUTCFullYear(), colombiaNow.getUTCMonth(), colombiaNow.getUTCDate() + 1);
  return { start: new Date(start), end: new Date(start + DAY_MS) };
}

export async function sendCheckInReminderEmails(): Promise<{
  sent: number;
  errors: number;
  skipped: number;
}> {
  const { start, end } = tomorrowDateRangeUtc();

  const bookings = await prisma.booking.findMany({
    where: {
      status: 'confirmed',
      checkIn: { gte: start, lt: end },
    },
    select: { id: true },
  });

  let sent = 0;
  let errors = 0;
  let skipped = 0;

  for (const booking of bookings) {
    try {
      const result = await sendCheckInReminderEmail({ bookingId: booking.id });
      if (result.sent && !result.deduped) sent++;
      else if (result.deduped || result.reason === 'no_recipient' || result.reason === 'opted_out') skipped++;
      else errors++;
    } catch {
      errors++;
    }
  }

  return { sent, errors, skipped };
}
