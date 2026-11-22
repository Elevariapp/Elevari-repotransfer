import { prisma } from '../lib/prisma.js';
import { sendBookingCancellationEmail } from '../lib/transactional-emails.js';

const DEFAULT_TTL_MINUTES = 30;

function pendingTtlMinutes(): number {
  const n = Number(process.env.BOOKING_PENDING_TTL_MINUTES ?? DEFAULT_TTL_MINUTES);
  return Number.isFinite(n) && n > 0 ? n : DEFAULT_TTL_MINUTES;
}

/** Cancel unpaid bookings past TTL and release availability blocks. */
export async function expireStalePendingBookings(): Promise<number> {
  const ttlMinutes = pendingTtlMinutes();
  const cutoff = new Date(Date.now() - ttlMinutes * 60 * 1000);

  const stale = await prisma.booking.findMany({
    where: {
      status: 'pending_payment',
      createdAt: { lt: cutoff },
    },
    select: { id: true },
  });

  for (const { id } of stale) {
    await prisma.$transaction(async (tx) => {
      const booking = await tx.booking.findUnique({ where: { id } });
      if (!booking || booking.status !== 'pending_payment') return;

      await tx.booking.update({
        where: { id },
        data: { status: 'cancelled' },
      });
      await tx.availabilityBlock.deleteMany({ where: { bookingId: id } });
      await tx.bookingEvent.create({
        data: {
          bookingId: id,
          fromStatus: 'pending_payment',
          toStatus: 'cancelled',
          metadata: { reason: 'expired_unpaid', ttl_minutes: ttlMinutes },
        },
      });
    });

    sendBookingCancellationEmail({
      bookingId: id,
      reason: `El pago no se completó en ${ttlMinutes} minutos. Las fechas quedaron liberadas.`,
      expiredUnpaid: true,
      refundEligible: false,
    }).catch(() => {
      /* non-blocking */
    });
  }

  return stale.length;
}

export function startPendingBookingExpiryJob(log: {
  info: (obj: object, msg: string) => void;
  error: (err: unknown, msg: string) => void;
}): NodeJS.Timeout {
  const intervalMs = Number(process.env.BOOKING_EXPIRY_JOB_INTERVAL_MS ?? 5 * 60 * 1000);

  const run = async () => {
    try {
      const count = await expireStalePendingBookings();
      if (count > 0) {
        log.info({ count }, 'Expired pending_payment bookings');
      }
    } catch (err) {
      log.error(err, 'expire pending bookings job failed');
    }
  };

  void run();
  return setInterval(run, intervalMs);
}
