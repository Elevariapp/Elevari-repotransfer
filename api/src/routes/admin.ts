import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { retryPendingInvoice } from '../lib/invoicing.js';
import { syncAllEnabledCalendarFeeds } from '../lib/ical/sync-feed.js';
import { authenticate, requireRoles } from '../plugins/auth.js';

const statusSchema = z.object({
  status: z.enum(['draft', 'published', 'unavailable', 'maintenance']),
});

export async function adminRoutes(app: FastifyInstance) {
  app.get(
    '/admin/overview',
    { preHandler: [authenticate, requireRoles(['admin'])] },
    async () => {
      const [properties, bookings, pendingMedia, pendingInvoices] = await prisma.$transaction([
        prisma.property.count(),
        prisma.booking.count({ where: { status: 'confirmed' } }),
        prisma.propertyMedia.count({ where: { status: 'pending' } }),
        prisma.pendingInvoice.count({ where: { status: { in: ['pending', 'failed'] } } }),
      ]);

      return {
        properties_total: properties,
        bookings_confirmed: bookings,
        media_pending: pendingMedia,
        invoices_pending: pendingInvoices,
      };
    },
  );

  app.get(
    '/admin/bookings',
    { preHandler: [authenticate, requireRoles(['admin'])] },
    async () => {
      const bookings = await prisma.booking.findMany({
        orderBy: { createdAt: 'desc' },
        take: 50,
        include: {
          property: { select: { title: true, slug: true } },
          guest: { select: { email: true, name: true } },
        },
      });

      return {
        data: bookings.map((b) => ({
          id: b.id,
          status: b.status,
          check_in: b.checkIn.toISOString().slice(0, 10),
          check_out: b.checkOut.toISOString().slice(0, 10),
          guests: b.guests,
          guest_email: b.guestEmail ?? b.guest.email,
          guest_name: b.guestName ?? b.guest.name,
          property_title: b.property.title,
          property_slug: b.property.slug,
          created_at: b.createdAt.toISOString(),
        })),
      };
    },
  );

  app.get(
    '/admin/properties',
    { preHandler: [authenticate, requireRoles(['admin'])] },
    async () => {
      const properties = await prisma.property.findMany({
        orderBy: { createdAt: 'desc' },
        take: 100,
        include: {
          host: { select: { email: true, name: true } },
          _count: { select: { media: true, bookings: true } },
        },
      });

      return {
        data: properties.map((p) => ({
          id: p.id,
          slug: p.slug,
          title: p.title,
          status: p.status,
          city: p.city,
          price_per_night: Number(p.pricePerNight),
          host_email: p.host.email,
          media_count: p._count.media,
          bookings_count: p._count.bookings,
          created_at: p.createdAt.toISOString(),
        })),
      };
    },
  );

  app.patch(
    '/admin/properties/:id/status',
    { preHandler: [authenticate, requireRoles(['admin'])] },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const body = statusSchema.safeParse(request.body);
      if (!body.success) {
        return reply.status(400).send({ error: 'Invalid body' });
      }

      const property = await prisma.property.update({
        where: { id },
        data: { status: body.data.status },
      });

      return { property: { id: property.id, status: property.status, slug: property.slug } };
    },
  );

  app.get(
    '/admin/media/pending',
    { preHandler: [authenticate, requireRoles(['admin'])] },
    async () => {
      const media = await prisma.propertyMedia.findMany({
        where: { status: 'pending' },
        orderBy: { createdAt: 'desc' },
        take: 100,
        include: {
          property: { select: { id: true, title: true, slug: true, hostId: true } },
        },
      });

      return {
        data: media.map((m) => ({
          id: m.id,
          type: m.type,
          url: m.url,
          thumbnail_url: m.thumbnailUrl,
          property_id: m.propertyId,
          property_title: m.property.title,
          property_slug: m.property.slug,
          created_at: m.createdAt.toISOString(),
        })),
      };
    },
  );

  app.post(
    '/admin/media/:id/approve',
    { preHandler: [authenticate, requireRoles(['admin'])] },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const media = await prisma.propertyMedia.update({
        where: { id },
        data: { status: 'approved' },
      });
      return { media: { id: media.id, status: media.status } };
    },
  );

  app.post(
    '/admin/media/:id/reject',
    { preHandler: [authenticate, requireRoles(['admin'])] },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const media = await prisma.propertyMedia.update({
        where: { id },
        data: { status: 'rejected' },
      });
      return { media: { id: media.id, status: media.status } };
    },
  );

  app.get(
    '/admin/invoices/pending',
    { preHandler: [authenticate, requireRoles(['admin'])] },
    async (_request, reply) => {
      const invoices = await prisma.pendingInvoice.findMany({
        where: { status: { in: ['pending', 'failed'] } },
        orderBy: { createdAt: 'desc' },
        take: 100,
        include: {
          booking: {
            select: {
              id: true,
              status: true,
              invoiceId: true,
              property: { select: { title: true } },
            },
          },
        },
      });

      return reply.send({ data: invoices });
    },
  );

  app.post(
    '/admin/invoices/:id/retry',
    { preHandler: [authenticate, requireRoles(['admin'])] },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const ok = await retryPendingInvoice(id);
      if (!ok) {
        return reply.status(422).send({ error: 'Invoice retry failed' });
      }
      return reply.send({ success: true });
    },
  );

  app.get(
    '/admin/calendar-sync',
    { preHandler: [authenticate, requireRoles(['admin'])] },
    async () => {
      const feeds = await prisma.propertyCalendarFeed.findMany({
        orderBy: [{ propertyId: 'asc' }, { channel: 'asc' }],
        include: { property: { select: { slug: true, title: true } } },
      });

      return {
        enabled: process.env.ICAL_SYNC_ENABLED === '1',
        data: feeds.map((f) => ({
          id: f.id,
          property_slug: f.property.slug,
          property_title: f.property.title,
          channel: f.channel,
          enabled: f.enabled,
          last_synced_at: f.lastSyncedAt?.toISOString() ?? null,
          last_error: f.lastError,
          event_count_last_sync: f.eventCountLastSync,
          skipped_last_sync: f.skippedLastSync,
          import_url_configured: Boolean(f.importUrl),
        })),
      };
    },
  );

  app.post(
    '/admin/calendar-sync/run',
    { preHandler: [authenticate, requireRoles(['admin'])] },
    async (_request, reply) => {
      if (process.env.ICAL_SYNC_ENABLED !== '1') {
        return reply.status(503).send({ error: 'ICAL_SYNC_DISABLED' });
      }

      const results = await syncAllEnabledCalendarFeeds();
      return { results };
    },
  );
}
