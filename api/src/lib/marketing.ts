import { createHash } from 'node:crypto';
import { prisma } from './prisma.js';
import { issueBookingInvoice } from './invoicing.js';
import {
  sendBookingConfirmationEmail,
  sendInvoiceReceiptEmail,
} from './transactional-emails.js';

export {
  sendBookingConfirmationEmail,
  sendBookingCancellationEmail,
  sendCheckInReminderEmail,
  sendCheckInReminderEmails,
  sendInvoiceReceiptEmail,
  sendPasswordChangedEmail,
  sendPasswordResetEmail,
  sendWelcomeEmail,
} from './transactional-emails.js';

export async function sendMetaPurchaseEvent(bookingId: string): Promise<void> {
  const pixelId = process.env.META_PIXEL_ID;
  const accessToken = process.env.META_ACCESS_TOKEN;
  if (!pixelId || !accessToken) return;

  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: { payments: { where: { status: 'succeeded' }, take: 1 } },
  });
  if (!booking) return;

  const fees = booking.feesBreakdown as { total_charge_to_guest?: number } | null;
  const value = Number(fees?.total_charge_to_guest ?? booking.payments[0]?.amount ?? 0);
  const email = booking.guestEmail ?? '';

  const hashedEmail = email
    ? createHash('sha256').update(email.trim().toLowerCase()).digest('hex')
    : undefined;

  const eventTime = Math.floor(Date.now() / 1000);

  await fetch(
    `https://graph.facebook.com/v19.0/${pixelId}/events?access_token=${accessToken}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        data: [
          {
            event_name: 'Purchase',
            event_time: eventTime,
            action_source: 'website',
            event_id: bookingId,
            user_data: hashedEmail ? { em: hashedEmail } : {},
            custom_data: {
              currency: 'COP',
              value,
              order_id: bookingId,
            },
          },
        ],
      }),
    },
  ).catch((err) => {
    console.error('[meta-capi]', err);
  });
}

export async function onBookingConfirmed(bookingId: string): Promise<void> {
  await Promise.allSettled([
    sendBookingConfirmationEmail(bookingId),
    sendMetaPurchaseEvent(bookingId),
    issueBookingInvoice(bookingId),
  ]);
}
