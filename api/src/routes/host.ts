import type { FastifyInstance } from 'fastify';
import { Prisma } from '@prisma/client';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { uniquePropertySlug } from '../lib/slug.js';
import { ApiErrorCode, apiErrorBody } from '../lib/api-errors.js';
import { colombiaToday } from '../lib/colombia-time.js';
import { nightsBetween, type WanaFees } from '../lib/fees.js';
import { authenticate, requireRoles } from '../plugins/auth.js';

// numeric(10,2) column: larger values overflow the column (used to surface as a 500).
const MAX_PRICE_PER_NIGHT = 99_999_999;
const MAX_AMENITIES = 30;

// The public catalog filters amenities by exact key, so these must be stored in canonical form.
const AMENITY_KEYS: Record<string, string> = {
  wifi: 'wifi',
  'wi-fi': 'wifi',
  fogata: 'fogata',
  vista: 'vista',
  'vista panoramica': 'vista',
  'vista panorámica': 'vista',
  estacionamiento: 'estacionamiento',
};

function normalizeAmenities(values: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const raw of values) {
    const value = AMENITY_KEYS[raw.toLowerCase()] ?? raw;
    const key = value.toLowerCase();
    if (!value || seen.has(key)) continue;
    seen.add(key);
    result.push(value);
  }
  return result;
}

const createPropertySchema = z.object({
  title: z
    .string({ required_error: 'El título es obligatorio', invalid_type_error: 'El título no es válido' })
    .trim()
    .min(3, 'El título debe tener al menos 3 caracteres')
    .max(120, 'El título no puede superar los 120 caracteres'),
  description: z
    .string({ required_error: 'La descripción es obligatoria', invalid_type_error: 'La descripción no es válida' })
    .trim()
    .min(20, 'La descripción debe tener al menos 20 caracteres')
    .max(5000, 'La descripción no puede superar los 5000 caracteres'),
  city: z
    .string({ required_error: 'La ciudad es obligatoria', invalid_type_error: 'La ciudad no es válida' })
    .trim()
    .min(2, 'La ciudad debe tener al menos 2 caracteres')
    .max(80, 'La ciudad no puede superar los 80 caracteres'),
  price_per_night: z
    .number({
      required_error: 'El precio por noche es obligatorio',
      invalid_type_error: 'El precio por noche debe ser un número',
    })
    .finite('El precio por noche no es válido')
    .min(1, 'El precio por noche debe ser mayor a 0')
    .max(MAX_PRICE_PER_NIGHT, 'El precio por noche es demasiado alto'),
  max_guests: z
    .number({ invalid_type_error: 'El máximo de huéspedes debe ser un número' })
    .int('El máximo de huéspedes debe ser un número entero')
    .min(1, 'El máximo de huéspedes debe ser al menos 1')
    .max(20, 'El máximo de huéspedes es 20')
    .default(2),
  amenities: z
    .array(z.string().trim().max(60, 'Cada comodidad puede tener hasta 60 caracteres'), {
      invalid_type_error: 'Las comodidades no son válidas',
    })
    .max(MAX_AMENITIES, `Puedes elegir hasta ${MAX_AMENITIES} comodidades`)
    .default([]),
});

const listQuerySchema = z.object({
  host_id: z.string().trim().min(1).max(64).optional(),
});

const bookingsQuerySchema = z.object({
  scope: z.enum(['upcoming', 'past', 'cancelled']).default('upcoming'),
  page: z.coerce.number().int().min(1).max(10_000).default(1),
  page_size: z.coerce.number().int().min(1).max(50).default(20),
  host_id: z.string().trim().min(1).max(64).optional(),
});

type BookingScope = z.infer<typeof bookingsQuerySchema>['scope'];

const HOST_VISIBLE_STATUSES = ['confirmed', 'checked_in'] as const;

/**
 * Only bookings a host has actually been told about: paid stays, and cancellations of stays that
 * had been paid. Unpaid checkouts (draft, pending_payment, expired) never reach the host.
 */
function hostBookingsWhere(hostId: string, scope: BookingScope, today: Date): Prisma.BookingWhereInput {
  const property = { hostId };
  switch (scope) {
    case 'upcoming':
      return { property, status: { in: [...HOST_VISIBLE_STATUSES] }, checkOut: { gte: today } };
    case 'past':
      return {
        property,
        OR: [{ status: 'completed' }, { status: { in: [...HOST_VISIBLE_STATUSES] }, checkOut: { lt: today } }],
      };
    case 'cancelled':
      return {
        property,
        status: 'cancelled',
        events: { some: { toStatus: 'cancelled', fromStatus: { in: [...HOST_VISIBLE_STATUSES] } } },
      };
  }
}

function hostBookingsOrder(scope: BookingScope): Prisma.BookingOrderByWithRelationInput[] {
  if (scope === 'upcoming') return [{ checkIn: 'asc' }, { createdAt: 'asc' }];
  if (scope === 'past') return [{ checkIn: 'desc' }, { createdAt: 'desc' }];
  return [{ updatedAt: 'desc' }];
}

const isoDay = (date: Date) => date.toISOString().slice(0, 10);

type CreatePropertyInput = z.infer<typeof createPropertySchema>;

async function createDraftProperty(hostId: string, input: CreatePropertyInput) {
  for (let attempt = 0; ; attempt++) {
    const slug = await uniquePropertySlug(input.title, { randomSuffix: attempt > 0 });
    try {
      return await prisma.property.create({
        data: {
          slug,
          title: input.title,
          description: input.description,
          city: input.city,
          pricePerNight: input.price_per_night,
          maxGuests: input.max_guests,
          amenities: normalizeAmenities(input.amenities),
          hostId,
          status: 'draft',
          country: 'CO',
        },
      });
    } catch (err) {
      // Two creations with the same title can pick the same slug; retry with a random suffix.
      const slugTaken = err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002';
      if (!slugTaken || attempt >= 3) throw err;
    }
  }
}

export async function hostRoutes(app: FastifyInstance) {
  // Unexpected failures must not leak Prisma/driver details to the client.
  app.setErrorHandler((error, request, reply) => {
    const statusCode = (error as { statusCode?: number }).statusCode;
    if (statusCode && statusCode < 500) return reply.send(error);
    request.log.error({ err: error }, 'host request failed');
    return reply.status(500).send({
      error: 'No pudimos completar la solicitud. Inténtalo de nuevo en unos minutos.',
      code: 'HOST_REQUEST_FAILED',
    });
  });

  app.get(
    '/host/properties',
    { preHandler: [authenticate, requireRoles(['host', 'admin'])] },
    async (request, reply) => {
      const query = listQuerySchema.safeParse(request.query);
      if (!query.success) {
        return reply
          .status(400)
          .send(apiErrorBody(ApiErrorCode.INVALID_QUERY, { message: 'El identificador del anfitrión no es válido.' }));
      }

      // Hosts only ever see their own listings; only admins may inspect another host.
      const hostId =
        request.auth!.role === 'admin' ? query.data.host_id ?? request.auth!.sub : request.auth!.sub;

      const properties = await prisma.property.findMany({
        where: { hostId },
        orderBy: { createdAt: 'desc' },
        include: {
          media: {
            where: { type: 'image', status: { not: 'rejected' } },
            orderBy: { sortOrder: 'asc' },
            take: 1,
          },
          _count: { select: { media: true } },
        },
      });

      const pendingByProperty = new Map<string, number>();
      if (properties.length > 0) {
        const pending = await prisma.propertyMedia.groupBy({
          by: ['propertyId'],
          where: { propertyId: { in: properties.map((p) => p.id) }, status: 'pending' },
          _count: { _all: true },
        });
        for (const row of pending) pendingByProperty.set(row.propertyId, row._count._all);
      }

      return {
        data: properties.map((p) => ({
          id: p.id,
          slug: p.slug,
          title: p.title,
          status: p.status,
          city: p.city,
          cover_image: p.media[0]?.thumbnailUrl ?? p.media[0]?.url ?? null,
          media_count: p._count.media,
          pending_media_count: pendingByProperty.get(p.id) ?? 0,
        })),
      };
    },
  );

  /**
   * Bookings on the host's own properties. Guests are shown by name only: contact details stay
   * with Elevari, the same as in the new-booking e-mail.
   */
  app.get(
    '/host/bookings',
    { preHandler: [authenticate, requireRoles(['host', 'admin'])] },
    async (request, reply) => {
      const query = bookingsQuerySchema.safeParse(request.query);
      if (!query.success) {
        return reply
          .status(400)
          .send(apiErrorBody(ApiErrorCode.INVALID_QUERY, { message: 'Los filtros de reservas no son válidos.' }));
      }

      const { scope, page, page_size: pageSize } = query.data;
      // Hosts only ever see bookings on their own listings; only admins may inspect another host.
      const hostId =
        request.auth!.role === 'admin' ? query.data.host_id ?? request.auth!.sub : request.auth!.sub;
      const where = hostBookingsWhere(hostId, scope, colombiaToday());

      const [rows, total] = await prisma.$transaction([
        prisma.booking.findMany({
          where,
          orderBy: hostBookingsOrder(scope),
          skip: (page - 1) * pageSize,
          take: pageSize,
          select: {
            id: true,
            status: true,
            checkIn: true,
            checkOut: true,
            guests: true,
            guestName: true,
            feesBreakdown: true,
            createdAt: true,
            guest: { select: { name: true, deletedAt: true } },
            property: { select: { id: true, title: true, slug: true } },
          },
        }),
        prisma.booking.count({ where }),
      ]);

      reply.header('Cache-Control', 'private, no-store');
      return {
        data: rows.map((booking) => {
          const fees = booking.feesBreakdown as Partial<WanaFees> | null;
          const guestName = booking.guest.deletedAt
            ? null
            : booking.guestName?.trim() || booking.guest.name?.trim() || null;
          return {
            id: booking.id,
            status: booking.status,
            property: booking.property,
            guest_name: guestName,
            guests: booking.guests,
            check_in: isoDay(booking.checkIn),
            check_out: isoDay(booking.checkOut),
            nights: nightsBetween(booking.checkIn, booking.checkOut),
            host_receives: typeof fees?.host_receives === 'number' ? fees.host_receives : null,
            currency: 'COP',
            created_at: booking.createdAt.toISOString(),
          };
        }),
        pagination: { page, page_size: pageSize, total, has_more: page * pageSize < total },
      };
    },
  );

  app.post(
    '/host/properties',
    { preHandler: [authenticate, requireRoles(['host', 'admin'])] },
    async (request, reply) => {
      const body = createPropertySchema.safeParse(request.body ?? {});
      if (!body.success) {
        return reply
          .status(400)
          .send(apiErrorBody(ApiErrorCode.INVALID_BODY, { details: body.error.flatten() }));
      }

      const property = await createDraftProperty(request.auth!.sub, body.data);

      return reply.status(201).send({
        property: {
          id: property.id,
          slug: property.slug,
          title: property.title,
          status: property.status,
          city: property.city,
          cover_image: null,
          media_count: 0,
          pending_media_count: 0,
        },
      });
    },
  );
}
