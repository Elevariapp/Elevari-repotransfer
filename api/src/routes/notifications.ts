import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { authenticate } from '../plugins/auth.js';
import { colombiaToday } from '../lib/colombia-time.js';
import {
  applyPreferencesPatch,
  preferencesPatchSchema,
  resolveNotificationPreferences,
} from '../lib/notification-prefs.js';

const DAY_MS = 24 * 60 * 60 * 1000;
const FEED_WINDOW_DAYS = 30;
const FEED_LIMIT = 50;

const SHORT_DATE = new Intl.DateTimeFormat('es-CO', { day: 'numeric', month: 'short', timeZone: 'UTC' });

function stayRange(checkIn: Date, checkOut: Date): string {
  return `${SHORT_DATE.format(checkIn)} → ${SHORT_DATE.format(checkOut)}`;
}

interface FeedItem {
  id: string;
  type: string;
  title: string;
  body: string;
  booking_id: string | null;
  created_at: string;
}

const pushTokenSchema = z.object({
  token: z.string().trim().min(10).max(300),
  platform: z.enum(['ios', 'android']),
});

export async function notificationRoutes(app: FastifyInstance) {
  /**
   * In-app notification feed, derived from booking history (no separate table to keep in sync).
   * Read state is tracked by each client.
   */
  app.get('/notifications', { preHandler: authenticate }, async (request) => {
    const userId = request.auth!.sub;
    const now = new Date();
    const since = new Date(now.getTime() - FEED_WINDOW_DAYS * DAY_MS);
    const today = colombiaToday(now);
    const tomorrow = new Date(today.getTime() + DAY_MS);

    const [events, upcoming, failedPayments, account] = await Promise.all([
      prisma.bookingEvent.findMany({
        where: {
          createdAt: { gte: since },
          toStatus: { in: ['confirmed', 'cancelled', 'checked_in', 'completed'] },
          booking: { OR: [{ guestId: userId }, { property: { hostId: userId } }] },
        },
        orderBy: { createdAt: 'desc' },
        take: 100,
        select: {
          id: true,
          fromStatus: true,
          toStatus: true,
          metadata: true,
          createdAt: true,
          booking: {
            select: {
              id: true,
              guestId: true,
              checkIn: true,
              checkOut: true,
              property: { select: { title: true, hostId: true } },
            },
          },
        },
      }),
      prisma.booking.findMany({
        where: { guestId: userId, status: 'confirmed', checkIn: { gte: today, lte: tomorrow } },
        select: { id: true, checkIn: true, property: { select: { title: true } } },
      }),
      prisma.payment.findMany({
        where: {
          status: 'failed',
          updatedAt: { gte: new Date(now.getTime() - 3 * DAY_MS) },
          booking: { guestId: userId, status: { in: ['draft', 'pending_payment'] } },
        },
        orderBy: { updatedAt: 'desc' },
        take: 5,
        select: {
          id: true,
          bookingId: true,
          updatedAt: true,
          booking: { select: { property: { select: { title: true } } } },
        },
      }),
      prisma.user.findUnique({ where: { id: userId }, select: { passwordChangedAt: true } }),
    ]);

    const items: FeedItem[] = [];

    for (const event of events) {
      const { booking } = event;
      const property = booking.property.title;
      const dates = stayRange(booking.checkIn, booking.checkOut);
      const base = { id: `event:${event.id}`, booking_id: booking.id, created_at: event.createdAt.toISOString() };

      if (booking.guestId === userId) {
        const reason = (event.metadata as { reason?: unknown } | null)?.reason;
        switch (event.toStatus) {
          case 'confirmed':
            items.push({ ...base, type: 'booking_confirmed', title: 'Reserva confirmada', body: `${property} · ${dates}` });
            break;
          case 'cancelled':
            items.push(
              reason === 'expired_unpaid'
                ? { ...base, type: 'booking_expired', title: 'Reserva expirada', body: `${property}: el pago no se completó a tiempo y las fechas se liberaron.` }
                : { ...base, type: 'booking_cancelled', title: 'Reserva cancelada', body: `${property} · ${dates}` },
            );
            break;
          case 'checked_in':
            items.push({ ...base, type: 'checked_in', title: 'Check-in registrado', body: `${property}. ¡Que disfrutes tu estadía!` });
            break;
          case 'completed':
            items.push({ ...base, type: 'stay_completed', title: 'Estadía completada', body: `Gracias por hospedarte en ${property}.` });
            break;
        }
      } else if (booking.property.hostId === userId) {
        if (event.toStatus === 'confirmed') {
          items.push({ ...base, type: 'host_new_booking', title: 'Nueva reserva', body: `${property} · ${dates}` });
        } else if (event.toStatus === 'cancelled' && event.fromStatus !== 'pending_payment' && event.fromStatus !== 'draft') {
          items.push({ ...base, type: 'host_booking_cancelled', title: 'Reserva cancelada', body: `${property} · ${dates}` });
        }
      }
    }

    for (const booking of upcoming) {
      // The reminder email goes out the evening before; show it from 07:00 Colombia time.
      const showAt = new Date(booking.checkIn.getTime() - 12 * 60 * 60 * 1000);
      if (showAt > now) continue;
      const isToday = booking.checkIn.getTime() === today.getTime();
      items.push({
        id: `checkin:${booking.id}`,
        type: 'check_in_soon',
        title: isToday ? 'Tu check-in es hoy' : 'Tu check-in es mañana',
        body: booking.property.title,
        booking_id: booking.id,
        created_at: showAt.toISOString(),
      });
    }

    for (const payment of failedPayments) {
      items.push({
        id: `payment-failed:${payment.id}`,
        type: 'payment_failed',
        title: 'No pudimos procesar tu pago',
        body: `Intenta de nuevo con otro método para asegurar ${payment.booking.property.title}.`,
        booking_id: payment.bookingId,
        created_at: payment.updatedAt.toISOString(),
      });
    }

    if (account?.passwordChangedAt && account.passwordChangedAt >= since) {
      items.push({
        id: `password-changed:${account.passwordChangedAt.getTime()}`,
        type: 'password_changed',
        title: 'Contraseña actualizada',
        body: 'Si no fuiste tú, restablécela de inmediato desde “Olvidé mi contraseña”.',
        booking_id: null,
        created_at: account.passwordChangedAt.toISOString(),
      });
    }

    items.sort((a, b) => b.created_at.localeCompare(a.created_at));
    return { data: items.slice(0, FEED_LIMIT) };
  });

  /** Which optional e-mails and push notifications the signed-in user receives. */
  app.get('/notifications/preferences', { preHandler: authenticate }, async (request, reply) => {
    const user = await prisma.user.findUnique({
      where: { id: request.auth!.sub },
      select: { notificationPrefs: true },
    });
    reply.header('Cache-Control', 'private, no-store');
    return { preferences: resolveNotificationPreferences(user?.notificationPrefs) };
  });

  app.patch('/notifications/preferences', {
    preHandler: authenticate,
    config: { rateLimit: { max: 30, timeWindow: '1 minute' } },
  }, async (request, reply) => {
    const body = preferencesPatchSchema.safeParse(request.body);
    if (!body.success) {
      return reply.status(400).send({ error: 'Invalid body', details: body.error.flatten() });
    }

    const userId = request.auth!.sub;
    const existing = await prisma.user.findUnique({ where: { id: userId }, select: { notificationPrefs: true } });
    const preferences = applyPreferencesPatch(resolveNotificationPreferences(existing?.notificationPrefs), body.data);
    await prisma.user.update({ where: { id: userId }, data: { notificationPrefs: preferences } });

    reply.header('Cache-Control', 'private, no-store');
    return { preferences };
  });

  /** Registers (or re-assigns) a device for push notifications. */
  app.post('/notifications/push-token', {
    preHandler: authenticate,
    config: { rateLimit: { max: 20, timeWindow: '1 minute' } },
  }, async (request, reply) => {
    const body = pushTokenSchema.safeParse(request.body);
    if (!body.success) {
      return reply.status(400).send({ error: 'Invalid body', details: body.error.flatten() });
    }

    const { token, platform } = body.data;
    await prisma.pushToken.upsert({
      where: { token },
      create: { token, platform, userId: request.auth!.sub },
      // A device that signs in as someone else moves to that account.
      update: { platform, userId: request.auth!.sub },
    });

    return { success: true };
  });
}
