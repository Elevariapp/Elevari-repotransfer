import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { uniquePropertySlug } from '../lib/slug.js';
import { authenticate, requireRoles } from '../plugins/auth.js';

const createPropertySchema = z.object({
  title: z.string().min(3).max(120),
  description: z.string().min(20).max(5000),
  city: z.string().min(2).max(80),
  price_per_night: z.number().positive(),
  max_guests: z.number().int().min(1).max(20).default(2),
  amenities: z.array(z.string()).default([]),
});

export async function hostRoutes(app: FastifyInstance) {
  app.get(
    '/host/properties',
    { preHandler: [authenticate, requireRoles(['host', 'admin'])] },
    async (request) => {
      const hostId =
        request.auth!.role === 'admin'
          ? (request.query as { host_id?: string }).host_id ?? request.auth!.sub
          : request.auth!.sub;

      const properties = await prisma.property.findMany({
        where: { hostId },
        orderBy: { createdAt: 'desc' },
        include: {
          media: { orderBy: { sortOrder: 'asc' }, take: 1 },
          _count: { select: { media: true } },
        },
      });

      return {
        data: properties.map((p) => ({
          id: p.id,
          slug: p.slug,
          title: p.title,
          status: p.status,
          city: p.city,
          cover_image: p.media[0]?.thumbnailUrl ?? p.media[0]?.url ?? null,
          media_count: p._count.media,
        })),
      };
    },
  );

  app.post(
    '/host/properties',
    { preHandler: [authenticate, requireRoles(['host', 'admin'])] },
    async (request, reply) => {
      const body = createPropertySchema.safeParse(request.body);
      if (!body.success) {
        return reply.status(400).send({ error: 'Invalid body', details: body.error.flatten() });
      }

      const hostId = request.auth!.sub;
      const slug = await uniquePropertySlug(body.data.title);

      const property = await prisma.property.create({
        data: {
          slug,
          title: body.data.title,
          description: body.data.description,
          city: body.data.city,
          pricePerNight: body.data.price_per_night,
          maxGuests: body.data.max_guests,
          amenities: body.data.amenities,
          hostId,
          status: 'draft',
          country: 'CO',
        },
      });

      return reply.status(201).send({
        property: {
          id: property.id,
          slug: property.slug,
          title: property.title,
          status: property.status,
          city: property.city,
        },
      });
    },
  );
}
