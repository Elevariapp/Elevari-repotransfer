import { prisma } from './prisma.js';
import { colombiaToday } from './colombia-time.js';
import { deletedAccountEmail } from './users.js';

const ACTIVE_STATUSES = ['pending_payment', 'confirmed', 'checked_in'] as const;

/** Stays (as guest or on the user's properties) that haven't ended, or payments still in flight. */
export async function countActiveBookings(userId: string): Promise<number> {
  return prisma.booking.count({
    where: {
      status: { in: [...ACTIVE_STATUSES] },
      checkOut: { gte: colombiaToday() },
      OR: [{ guestId: userId }, { property: { hostId: userId } }],
    },
  });
}

/**
 * Removes personal data in place. The row stays (bookings and payments reference it and
 * must be kept for accounting), but it can no longer be matched to a person or sign in.
 * Invoices that still need to be issued keep their guest data until Alegra accepts them.
 */
export async function anonymizeAccount(userId: string): Promise<void> {
  const now = new Date();
  await prisma.$transaction([
    prisma.pushToken.deleteMany({ where: { userId } }),
    prisma.booking.updateMany({
      where: { guestId: userId },
      data: { guestEmail: null, guestName: null },
    }),
    prisma.pendingInvoice.updateMany({
      where: { status: 'issued', booking: { guestId: userId } },
      data: { guestEmail: null, guestName: null },
    }),
    prisma.property.updateMany({
      where: { hostId: userId, status: { not: 'draft' } },
      data: { status: 'draft' },
    }),
    prisma.user.update({
      where: { id: userId },
      data: {
        email: deletedAccountEmail(userId),
        name: null,
        phone: null,
        passwordHash: null,
        deletedAt: now,
      },
    }),
  ]);
}
