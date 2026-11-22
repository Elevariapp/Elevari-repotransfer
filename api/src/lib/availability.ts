import { prisma } from './prisma.js';

/**
 * Check if date ranges overlap (exclusive end: check-out day is available for next guest).
 * Overlap when: existing.start < requested.end AND existing.end > requested.start
 */
export async function isPropertyAvailable(
  propertyId: string,
  checkIn: Date,
  checkOut: Date,
  excludeBookingId?: string,
): Promise<boolean> {
  const overlap = await prisma.availabilityBlock.findFirst({
    where: {
      propertyId,
      startDate: { lt: checkOut },
      endDate: { gt: checkIn },
      ...(excludeBookingId
        ? { OR: [{ bookingId: null }, { bookingId: { not: excludeBookingId } }] }
        : {}),
    },
  });
  return !overlap;
}
