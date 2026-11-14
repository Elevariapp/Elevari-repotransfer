import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma.js';
import { apiErrorBody, ApiErrorCode } from '../lib/api-errors.js';

const listQuerySchema = z.object({
  city: z.string().optional(),
  guests: z.coerce.number().int().positive().optional(),
  check_in: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  check_out: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  sort: z.enum(['recommended', 'price_asc', 'price_desc', 'popular', 'newest']).default('recommended'),
  min_price: z.coerce.number().int().min(0).optional(),
  max_price: z.coerce.number().int().min(0).optional(),
  amenities: z.string().max(200).optional(),
  limit: z.coerce.number().int().min(1).max(50).default(24),
  offset: z.coerce.number().int().min(0).default(0),
});

const ORDER_BY: Record<string, Prisma.PropertyOrderByWithRelationInput[]> = {
  recommended: [{ createdAt: 'desc' }],
  price_asc: [{ pricePerNight: 'asc' }],
  price_desc: [{ pricePerNight: 'desc' }],
  popular: [{ bookings: { _count: 'desc' } }],
  newest: [{ createdAt: 'desc' }],
};

function parseDateUTC(dateStr: string): Date {
  return new Date(`${dateStr}T00:00:00.000Z`);
}

function serializeProperty(property: {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  pricePerNight: { toString(): string };
  maxGuests: number;
  status: string;
  city: string | null;
  country: string;
  latitude?: { toString(): string } | null;
  longitude?: { toString(): string } | null;
  amenities: unknown;
  media: Array<{
    id: string;
    type: string;
    url: string;
    thumbnailUrl: string | null;
    sortOrder: number;
  }>;
  reviews: Array<{ id?: string; rating: number; comment?: string | null; createdAt?: Date }>;
}) {
  const ratings = property.reviews.map((r) => r.rating);
  const avgRating =
    ratings.length > 0 ? ratings.reduce((a, b) => a + b, 0) / ratings.length : null;

  const serializedReviews = property.reviews.some((r) => r.id)
    ? property.reviews.map((r) => ({
        id: r.id!,
        rating: r.rating,
        comment: r.comment ?? null,
        created_at: r.createdAt?.toISOString(),
      }))
    : undefined;

  return {
    id: property.id,
    slug: property.slug,
    title: property.title,
    description: property.description,
    price_per_night: Number(property.pricePerNight),
    max_guests: property.maxGuests,
    status: property.status,
    city: property.city,
    country: property.country,
    latitude: property.latitude != null ? Number(property.latitude) : null,
    longitude: property.longitude != null ? Number(property.longitude) : null,
    amenities: property.amenities,
    cover_image: property.media[0]?.thumbnailUrl ?? property.media[0]?.url ?? null,
    media: property.media,
    rating: avgRating ? Math.round(avgRating * 10) / 10 : null,
    review_count: ratings.length,
    ...(serializedReviews ? { reviews: serializedReviews } : {}),
  };
}

export async function propertyRoutes(app: FastifyInstance) {
  app.get('/properties', async (request, reply) => {
    const query = listQuerySchema.safeParse(request.query);
    if (!query.success) {
      return reply.status(400).send({ error: 'Invalid query', details: query.error.flatten() });
    }

    const { city, guests, check_in, check_out, sort, min_price, max_price, amenities, limit, offset } =
      query.data;

    let dateFilter: Record<string, unknown> = {};
    if (check_in && check_out) {
      const checkIn = parseDateUTC(check_in);
      const checkOut = parseDateUTC(check_out);
      if (checkOut <= checkIn) {
        return reply.status(400).send(apiErrorBody(ApiErrorCode.INVALID_DATE_RANGE));
      }
      dateFilter = {
        NOT: {
          availabilityBlocks: {
            some: {
              startDate: { lt: checkOut },
              endDate: { gt: checkIn },
            },
          },
        },
      };
    }

    // Price range (COP major units).
    const priceFilter =
      min_price !== undefined || max_price !== undefined
        ? {
            pricePerNight: {
              ...(min_price !== undefined ? { gte: min_price } : {}),
              ...(max_price !== undefined ? { lte: max_price } : {}),
            },
          }
        : {};

    // Amenities: every requested amenity must be present in the JSON array.
    const amenityList = (amenities ?? '')
      .split(',')
      .map((a) => a.trim().toLowerCase())
      .filter(Boolean)
      .slice(0, 10);
    const amenityFilter = amenityList.map((amenity) => ({
      amenities: { array_contains: amenity },
    }));

    const where: Prisma.PropertyWhereInput = {
      status: 'published',
      ...(city ? { city: { contains: city, mode: 'insensitive' } } : {}),
      ...(guests ? { maxGuests: { gte: guests } } : {}),
      ...priceFilter,
      ...dateFilter,
      ...(amenityFilter.length > 0 ? { AND: amenityFilter } : {}),
    };

    const [properties, total] = await Promise.all([
      prisma.property.findMany({
        where,
        include: {
          media: {
            where: { status: 'approved' },
            orderBy: { sortOrder: 'asc' },
            take: 5,
          },
          reviews: { where: { isVisible: true }, select: { rating: true } },
        },
        orderBy: ORDER_BY[sort] ?? ORDER_BY.recommended,
        take: limit,
        skip: offset,
      }),
      prisma.property.count({ where }),
    ]);

    return {
      data: properties.map(serializeProperty),
      meta: { limit, offset, count: properties.length, total, sort },
    };
  });

  app.get('/properties/:slug', async (request, reply) => {
    const { slug } = request.params as { slug: string };

    const property = await prisma.property.findUnique({
      where: { slug },
      include: {
        media: {
          where: { status: 'approved' },
          orderBy: { sortOrder: 'asc' },
        },
        reviews: {
          where: { isVisible: true },
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
      },
    });

    if (!property || property.status !== 'published') {
      return reply.status(404).send({ error: 'Property not found' });
    }

    return serializeProperty(property);
  });

  app.get('/properties/:id/availability', async (request, reply) => {
    const { id } = request.params as { id: string };

    const property = await prisma.property.findUnique({ where: { id } });
    if (!property) {
      return reply.status(404).send({ error: 'Property not found' });
    }

    const blocks = await prisma.availabilityBlock.findMany({
      where: { propertyId: id },
      select: { startDate: true, endDate: true, source: true },
      orderBy: { startDate: 'asc' },
    });

    return {
      property_id: id,
      blocked_ranges: blocks.map((b) => ({
        start: b.startDate.toISOString().slice(0, 10),
        end: b.endDate.toISOString().slice(0, 10),
        source: b.source,
      })),
    };
  });
}
