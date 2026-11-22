import { Prisma, type Booking, type PrismaClient } from '@prisma/client';
import { prisma } from './prisma.js';

type TransactionClient = Omit<
  PrismaClient,
  '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'
>;

export class DatesNotAvailableError extends Error {
  constructor() {
    super('DATES_NOT_AVAILABLE');
    this.name = 'DatesNotAvailableError';
  }
}

/** Serialize concurrent bookings for the same property (within the transaction). */
export async function lockPropertyForBooking(
  tx: TransactionClient,
  propertyId: string,
): Promise<void> {
  const rows = await tx.$queryRaw<{ id: string }[]>`
    SELECT id FROM properties WHERE id = ${propertyId} FOR UPDATE
  `;
  if (rows.length === 0) {
    throw new Error('PROPERTY_NOT_FOUND');
  }
}

export async function hasOverlappingAvailabilityBlock(
  tx: TransactionClient,
  propertyId: string,
  checkIn: Date,
  checkOut: Date,
): Promise<boolean> {
  const overlap = await tx.availabilityBlock.findFirst({
    where: {
      propertyId,
      startDate: { lt: checkOut },
      endDate: { gt: checkIn },
    },
    select: { id: true },
  });
  return overlap !== null;
}

export function isAvailabilityConflictError(err: unknown): boolean {
  if (err instanceof DatesNotAvailableError) return true;

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2004') {
      const message = err.message.toLowerCase();
      return (
        message.includes('availability_blocks_no_overlap') ||
        message.includes('exclusion')
      );
    }
  }

  if (typeof err === 'object' && err !== null && 'code' in err) {
    const code = (err as { code: string }).code;
    if (code === '23P01') return true;
  }

  return false;
}

export interface CreateBookingWithBlockInput {
  propertyId: string;
  guestId: string;
  checkIn: Date;
  checkOut: Date;
  guests: number;
  feesBreakdown: object;
  idempotencyKey: string;
  guestEmail: string;
  guestName: string;
}

/**
 * Atomically reserve dates: property row lock + overlap check + EXCLUDE constraint on insert.
 */
export async function createBookingWithAvailabilityBlock(
  input: CreateBookingWithBlockInput,
): Promise<Booking> {
  return prisma.$transaction(async (tx) => {
    await lockPropertyForBooking(tx, input.propertyId);

    if (
      await hasOverlappingAvailabilityBlock(
        tx,
        input.propertyId,
        input.checkIn,
        input.checkOut,
      )
    ) {
      throw new DatesNotAvailableError();
    }

    const created = await tx.booking.create({
      data: {
        propertyId: input.propertyId,
        guestId: input.guestId,
        checkIn: input.checkIn,
        checkOut: input.checkOut,
        guests: input.guests,
        status: 'pending_payment',
        feesBreakdown: input.feesBreakdown as Prisma.InputJsonValue,
        idempotencyKey: input.idempotencyKey,
        guestEmail: input.guestEmail,
        guestName: input.guestName,
      },
    });

    await tx.availabilityBlock.create({
      data: {
        propertyId: input.propertyId,
        startDate: input.checkIn,
        endDate: input.checkOut,
        source: 'booking',
        bookingId: created.id,
      },
    });

    await tx.bookingEvent.create({
      data: {
        bookingId: created.id,
        fromStatus: 'draft',
        toStatus: 'pending_payment',
        metadata: { source: 'api' },
      },
    });

    return created;
  });
}
