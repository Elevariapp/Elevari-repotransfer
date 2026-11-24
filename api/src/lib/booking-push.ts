import { prisma } from './prisma.js';
import { bookingNotificationCopy, stayRange, type BookingNotificationType } from './notification-copy.js';
import type { PushPreferenceKey } from './notification-prefs.js';
import { sendPushToUser, type PushResult } from './push.js';
import { tomorrowDateRangeUtc } from './transactional-emails.js';

type Audience = 'guest' | 'host';

const SKIPPED: PushResult = { sent: 0, reason: 'no_recipient' };

/** Looks the booking up and pushes the matching feed wording to its guest or host. Never throws. */
async function notify(
  bookingId: string,
  audience: Audience,
  type: BookingNotificationType,
  category: PushPreferenceKey,
): Promise<PushResult> {
  try {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      select: {
        id: true,
        guestId: true,
        checkIn: true,
        checkOut: true,
        property: { select: { title: true, hostId: true } },
      },
    });
    if (!booking) return SKIPPED;

    const copy = bookingNotificationCopy(type, {
      property: booking.property.title,
      dates: stayRange(booking.checkIn, booking.checkOut),
    });
    const userId = audience === 'guest' ? booking.guestId : booking.property.hostId;
    return await sendPushToUser(userId, category, { ...copy, data: { type, booking_id: booking.id } });
  } catch (err) {
    console.warn('[push] could not notify', { type, error: err instanceof Error ? err.name : 'unknown' });
    return SKIPPED;
  }
}

export const pushBookingConfirmed = (bookingId: string) =>
  notify(bookingId, 'guest', 'booking_confirmed', 'bookings');
export const pushHostNewBooking = (bookingId: string) =>
  notify(bookingId, 'host', 'host_new_booking', 'host_bookings');
export const pushBookingCancelled = (bookingId: string) =>
  notify(bookingId, 'guest', 'booking_cancelled', 'bookings');
export const pushHostBookingCancelled = (bookingId: string) =>
  notify(bookingId, 'host', 'host_booking_cancelled', 'host_bookings');
export const pushBookingExpired = (bookingId: string) =>
  notify(bookingId, 'guest', 'booking_expired', 'bookings');

/**
 * The reminder job runs every few hours, so each booking is claimed first: only the run that
 * flips `checkInReminderPushedAt` sends. If Expo is down the claim is released for the next run.
 */
export async function pushCheckInReminder(bookingId: string): Promise<PushResult | 'already_sent'> {
  const claimed = await prisma.booking.updateMany({
    where: { id: bookingId, status: 'confirmed', checkInReminderPushedAt: null },
    data: { checkInReminderPushedAt: new Date() },
  });
  if (claimed.count === 0) return 'already_sent';

  const result = await notify(bookingId, 'guest', 'check_in_soon', 'reminders');
  if (result.reason === 'provider_error') {
    await prisma.booking
      .updateMany({ where: { id: bookingId }, data: { checkInReminderPushedAt: null } })
      .catch(() => undefined);
  }
  return result;
}

export async function sendCheckInReminderPushes(): Promise<{ sent: number; skipped: number }> {
  const { start, end } = tomorrowDateRangeUtc();
  const bookings = await prisma.booking.findMany({
    where: { status: 'confirmed', checkIn: { gte: start, lt: end }, checkInReminderPushedAt: null },
    select: { id: true },
  });

  let sent = 0;
  let skipped = 0;
  for (const { id } of bookings) {
    const result = await pushCheckInReminder(id);
    if (result !== 'already_sent' && result.sent > 0) sent += 1;
    else skipped += 1;
  }
  return { sent, skipped };
}
