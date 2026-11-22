import type { FastifyInstance } from 'fastify';
import { Prisma } from '@prisma/client';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { apiErrorBody, ApiErrorCode, maxGuestsError } from '../lib/api-errors.js';
import { isPropertyAvailable } from '../lib/availability.js';
import { calculateWanaFees, nightsBetween } from '../lib/fees.js';
import { assertTransition } from '../lib/booking-state.js';
import {
  createBookingWithAvailabilityBlock,
  isAvailabilityConflictError,
} from '../lib/reserve-availability.js';
import { calculateCancellationRefund } from '../lib/cancellation-policy.js';
import { issuePaymentRefund } from '../lib/refund-payment.js';
import { sendBookingCancellationEmail } from '../lib/transactional-emails.js';
import { authenticate } from '../plugins/auth.js';

const dateString = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

const quoteSchema = z.object({
  property_id: z.string().uuid(),
  check_in: dateString,
  check_out: dateString,
  guests: z.number().int().positive().default(1),
});

const createBookingSchema = quoteSchema.extend({
  guest_email: z.string().email().optional(),
  guest_name: z.string().min(1).optional(),
  idempotency_key: z.string().min(8).max(128),
});

function parseDateUTC(dateStr: string): Date {
  return new Date(`${dateStr}T00:00:00.000Z`);
}

export async function bookingRoutes(app: FastifyInstance) {
  app.post('/bookings/quote', async (request, reply) => {
    const body = quoteSchema.safeParse(request.body);
    if (!body.success) {
      return reply.status(400).send({ error: 'Invalid body', details: body.error.flatten() });
    }

    const { property_id, check_in, check_out, guests } = body.data;
    const checkIn = parseDateUTC(check_in);
    const checkOut = parseDateUTC(check_out);

    if (checkOut <= checkIn) {
      return reply.status(400).send(apiErrorBody(ApiErrorCode.INVALID_DATE_RANGE));
    }

    const property = await prisma.property.findUnique({ where: { id: property_id } });
    if (!property || property.status !== 'published') {
      return reply.status(404).send({ error: 'Property not found' });
    }

    if (guests > property.maxGuests) {
      return reply.status(400).send(maxGuestsError(property.maxGuests));
    }

    const nights = nightsBetween(checkIn, checkOut);
    const available = await isPropertyAvailable(property_id, checkIn, checkOut);

    const fees = calculateWanaFees(Number(property.pricePerNight), nights);

    return {
      property_id,
      check_in,
      check_out,
      guests,
      nights,
      available,
      fees,
      currency: property.country === 'CO' ? 'COP' : 'USD',
    };
  });

  app.post('/bookings', { preHandler: authenticate }, async (request, reply) => {
    const body = createBookingSchema.safeParse(request.body);
    if (!body.success) {
      return reply.status(400).send({ error: 'Invalid body', details: body.error.flatten() });
    }

    const data = body.data;
    const guestId = request.auth!.sub;
    const guestEmail = data.guest_email ?? request.auth!.email;
    const guestName = data.guest_name ?? guestEmail.split('@')[0];
    const checkIn = parseDateUTC(data.check_in);
    const checkOut = parseDateUTC(data.check_out);

    if (checkOut <= checkIn) {
      return reply.status(400).send(apiErrorBody(ApiErrorCode.INVALID_DATE_RANGE));
    }

    const existing = await prisma.booking.findUnique({
      where: { idempotencyKey: data.idempotency_key },
    });
    if (existing) {
      return reply.status(200).send({ booking: existing, reused: true });
    }

    const property = await prisma.property.findUnique({ where: { id: data.property_id } });
    if (!property || property.status !== 'published') {
      return reply.status(404).send({ error: 'Property not found' });
    }

    if (data.guests > property.maxGuests) {
      return reply.status(400).send(maxGuestsError(property.maxGuests));
    }

    const nights = nightsBetween(checkIn, checkOut);
    const fees = calculateWanaFees(Number(property.pricePerNight), nights);

    try {
      const booking = await createBookingWithAvailabilityBlock({
        propertyId: data.property_id,
        guestId,
        checkIn,
        checkOut,
        guests: data.guests,
        feesBreakdown: fees as object,
        idempotencyKey: data.idempotency_key,
        guestEmail,
        guestName,
      });

      return reply.status(201).send({ booking, reused: false });
    } catch (err) {
      if (isAvailabilityConflictError(err)) {
        return reply.status(409).send(apiErrorBody(ApiErrorCode.DATES_NOT_AVAILABLE));
      }

      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === 'P2002' &&
        Array.isArray(err.meta?.target) &&
        err.meta.target.includes('idempotency_key')
      ) {
        const reused = await prisma.booking.findUnique({
          where: { idempotencyKey: data.idempotency_key },
        });
        if (reused) {
          return reply.status(200).send({ booking: reused, reused: true });
        }
      }

      throw err;
    }
  });

  app.get('/bookings/me', { preHandler: authenticate }, async (request) => {
    const bookings = await prisma.booking.findMany({
      where: { guestId: request.auth!.sub },
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: {
        property: { select: { id: true, slug: true, title: true, city: true } },
      },
    });

    return {
      data: bookings.map((b) => ({
        id: b.id,
        status: b.status,
        check_in: b.checkIn.toISOString().slice(0, 10),
        check_out: b.checkOut.toISOString().slice(0, 10),
        guests: b.guests,
        property_title: b.property.title,
        property_slug: b.property.slug,
        property_city: b.property.city,
        created_at: b.createdAt.toISOString(),
        total: (b.feesBreakdown as { total_charge_to_guest?: number } | null)?.total_charge_to_guest,
      })),
    };
  });

  app.get('/bookings/:id', { preHandler: authenticate }, async (request, reply) => {
    const { id } = request.params as { id: string };

    const booking = await prisma.booking.findUnique({
      where: { id },
      include: {
        property: {
          select: { id: true, slug: true, title: true, city: true, country: true },
        },
        payments: { orderBy: { createdAt: 'desc' }, take: 5 },
      },
    });

    if (!booking) {
      return reply.status(404).send({ error: 'Booking not found' });
    }

    if (booking.guestId !== request.auth!.sub && request.auth!.role !== 'admin') {
      return reply.status(403).send({ error: 'Not authorized' });
    }

    return { booking };
  });

  app.post('/bookings/:id/cancel', { preHandler: authenticate }, async (request, reply) => {
    const { id } = request.params as { id: string };

    const booking = await prisma.booking.findUnique({
      where: { id },
      include: {
        payments: { where: { status: 'succeeded' }, orderBy: { createdAt: 'desc' }, take: 1 },
      },
    });
    if (!booking) {
      return reply.status(404).send({ error: 'Booking not found' });
    }

    if (booking.guestId !== request.auth!.sub && request.auth!.role !== 'admin') {
      return reply.status(403).send({ error: 'Not authorized' });
    }

    if (booking.status === 'cancelled') {
      return reply.status(400).send({ error: 'Booking is already cancelled' });
    }

    if (booking.status === 'checked_in' || booking.status === 'completed') {
      return reply.status(400).send({ error: `Cannot cancel booking in status ${booking.status}` });
    }

    try {
      assertTransition(booking.status, 'cancelled');
    } catch {
      return reply.status(400).send({ error: `Cannot cancel booking in status ${booking.status}` });
    }

    let refundInfo: Awaited<ReturnType<typeof calculateCancellationRefund>> | null = null;
    let refundResult: Awaited<ReturnType<typeof issuePaymentRefund>> | null = null;

    if (booking.status === 'confirmed') {
      refundInfo = calculateCancellationRefund({
        checkIn: booking.checkIn,
        feesBreakdown: booking.feesBreakdown,
      });

      if (refundInfo.eligible && refundInfo.refund_amount > 0 && booking.payments[0]) {
        refundResult = await issuePaymentRefund(booking.payments[0], refundInfo.refund_amount);
      }
    }

    const updated = await prisma.$transaction(async (tx) => {
      const b = await tx.booking.update({
        where: { id },
        data: { status: 'cancelled' },
      });

      await tx.availabilityBlock.deleteMany({ where: { bookingId: id } });
      await tx.bookingEvent.create({
        data: {
          bookingId: id,
          fromStatus: booking.status,
          toStatus: 'cancelled',
          metadata: {
            refund: refundInfo,
            refund_result: refundResult,
          } as object,
        },
      });

      return b;
    });

    const cancellationReason =
      refundInfo?.reason ??
      (booking.status === 'pending_payment'
        ? 'Reserva pendiente de pago — sin cargo.'
        : 'Reserva cancelada según solicitud.');

    sendBookingCancellationEmail({
      bookingId: id,
      reason: cancellationReason,
      refundAmount: refundInfo?.refund_amount,
      refundEligible: refundInfo?.eligible,
      expiredUnpaid: false,
    }).catch((err) => {
      request.log.warn({ err, bookingId: id }, 'Cancellation email not sent');
    });

    return {
      booking: updated,
      cancellation: {
        policy: refundInfo?.policy ?? 'moderate',
        refund_eligible: refundInfo?.eligible ?? false,
        refund_amount: refundInfo?.refund_amount ?? 0,
        refund_percent: refundInfo?.refund_percent ?? 0,
        reason: refundInfo?.reason ?? 'Reserva pendiente de pago — sin cargo.',
        refund_status: refundResult?.status ?? (booking.status === 'pending_payment' ? 'skipped' : 'not_applicable'),
      },
    };
  });
}
