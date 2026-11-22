import type { Booking, Payment } from '@prisma/client';
import type { JwtPayload } from './auth.js';
import { prisma } from './prisma.js';

export function isBookingGuestOrAdmin(booking: { guestId: string }, auth: JwtPayload): boolean {
  return booking.guestId === auth.sub || auth.role === 'admin';
}

export async function getBookingForGuestOrAdmin(
  bookingId: string,
  auth: JwtPayload,
): Promise<{ booking: Booking } | { error: 'not_found' | 'forbidden' }> {
  const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
  if (!booking) return { error: 'not_found' };
  if (!isBookingGuestOrAdmin(booking, auth)) return { error: 'forbidden' };
  return { booking };
}

export async function getPaymentForGuestOrAdmin(
  paymentId: string,
  auth: JwtPayload,
): Promise<{ payment: Payment & { booking: Booking } } | { error: 'not_found' | 'forbidden' }> {
  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
    include: { booking: true },
  });
  if (!payment) return { error: 'not_found' };
  if (!isBookingGuestOrAdmin(payment.booking, auth)) return { error: 'forbidden' };
  return { payment };
}

export function accessErrorReply(
  error: 'not_found' | 'forbidden',
): { status: 404 | 403; body: { error: string } } {
  if (error === 'forbidden') {
    return { status: 403, body: { error: 'Not authorized' } };
  }
  return { status: 404, body: { error: 'Not found' } };
}
