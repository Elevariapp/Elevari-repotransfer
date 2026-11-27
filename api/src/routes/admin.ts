import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { retryPendingInvoice } from '../lib/invoicing.js';
import { syncAllEnabledCalendarFeeds } from '../lib/ical/sync-feed.js';
import { authenticate, requireRoles } from '../plugins/auth.js';
import {
  sendMediaApprovedEmail,
  sendMediaRejectedEmail,
} from '../lib/transactional-emails.js';
import { deliverEmail } from '../lib/email.js';
import { REVIEW_SLA_MS } from '../lib/ai-moderation.js';
import { downloadPrivateObject } from '../lib/minio.js';
import { sendPushToUser } from '../lib/push.js';

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
      // Oldest deadline first: whatever is closest to breaching the 1-hour SLA is on top.
      const media = await prisma.propertyMedia.findMany({
        where: { status: 'pending' },
        orderBy: [{ reviewDueAt: 'asc' }, { createdAt: 'asc' }],
        take: 100,
        include: {
          property: { select: { id: true, title: true, slug: true, hostId: true } },
        },
      });

      const now = Date.now();
      return {
        data: media.map((m) => ({
          id: m.id,
          type: m.type,
          url: m.url,
          thumbnail_url: m.thumbnailUrl,
          property_id: m.propertyId,
          property_title: m.property.title,
          property_slug: m.property.slug,
          ai_verdict: m.aiVerdict,
          ai_score: m.aiScore,
          ai_reason: m.aiReason,
          review_due_at: m.reviewDueAt?.toISOString() ?? null,
          sla_breached: m.reviewDueAt ? m.reviewDueAt.getTime() < now : false,
          created_at: m.createdAt.toISOString(),
        })),
      };
    },
  );

  /**
   * Hosts waiting for an identity decision. Sorted by the same one-hour deadline the host was
   * promised, so the admin queue can never again turn into a 48-hour wait.
   */
  app.get(
    '/admin/verifications',
    { preHandler: [authenticate, requireRoles(['admin'])] },
    async () => {
      const users = await prisma.user.findMany({
        where: {
          verificationSubmittedAt: { not: null },
          verificationStatus: { in: ['pending', 'rejected'] },
        },
        orderBy: { verificationSubmittedAt: 'asc' },
        take: 100,
        select: {
          id: true,
          email: true,
          name: true,
          idVerified: true,
          verificationStatus: true,
          verificationSubmittedAt: true,
          verificationVerdict: true,
          verificationScore: true,
          verificationReason: true,
          verificationDocUrl: true,
          verificationSelfieUrl: true,
        },
      });

      const now = Date.now();
      return {
        data: users.map((user) => {
          const submitted = user.verificationSubmittedAt;
          const dueAt = submitted ? submitted.getTime() + REVIEW_SLA_MS : null;
          return {
            user_id: user.id,
            email: user.email,
            name: user.name,
            status: user.verificationStatus,
            ai_verdict: user.verificationVerdict,
            ai_score: user.verificationScore,
            ai_reason: user.verificationReason,
            has_document: Boolean(user.verificationDocUrl),
            has_selfie: Boolean(user.verificationSelfieUrl),
            submitted_at: submitted?.toISOString() ?? null,
            review_due_at: dueAt ? new Date(dueAt).toISOString() : null,
            sla_breached: dueAt ? dueAt < now : false,
          };
        }),
      };
    },
  );

  /**
   * Streams a private identity document to an admin. It is the only way to read the file:
   * nothing in the private bucket is publicly reachable.
   */
  app.get(
    '/admin/verifications/:id/document',
    { preHandler: [authenticate, requireRoles(['admin'])] },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const kind = (request.query as { kind?: string }).kind === 'selfie' ? 'selfie' : 'document';
      const user = await prisma.user.findUnique({
        where: { id },
        select: { verificationDocUrl: true, verificationSelfieUrl: true },
      });
      const key = kind === 'selfie' ? user?.verificationSelfieUrl : user?.verificationDocUrl;
      if (!key) return reply.status(404).send({ error: 'Document not found' });

      try {
        const buffer = await downloadPrivateObject(key);
        reply.header('Cache-Control', 'private, no-store');
        return reply.type('image/jpeg').send(buffer);
      } catch (err) {
        request.log.warn({ err }, 'could not read a verification document');
        return reply.status(503).send({ error: 'Storage unavailable' });
      }
    },
  );

  app.post(
    '/admin/media/:id/approve',
    { preHandler: [authenticate, requireRoles(['admin'])] },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const media = await prisma.propertyMedia.update({
        where: { id },
        data: { status: 'approved', reviewedAt: new Date(), aiVerdict: 'approved', aiReason: 'manual_approval', reviewDueAt: null },
        include: {
          property: { select: { title: true, hostId: true } },
        },
      });
      const host = await prisma.user.findUnique({
        where: { id: media.property.hostId },
        select: { email: true, name: true },
      });
      if (host?.email) {
        void sendMediaApprovedEmail({
          email: host.email,
          name: host.name,
          propertyName: media.property.title,
          mediaType: media.type,
          mediaUrl: media.url,
        });
      }
      return { media: { id: media.id, status: media.status } };
    }
  );

  app.post(
    '/admin/media/:id/reject',
    { preHandler: [authenticate, requireRoles(['admin'])] },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const media = await prisma.propertyMedia.update({
        where: { id },
        data: { status: 'rejected', reviewedAt: new Date(), aiVerdict: 'rejected', aiReason: 'manual_rejection', reviewDueAt: null },
        include: {
          property: { select: { title: true, hostId: true } },
        },
      });
      const host = await prisma.user.findUnique({
        where: { id: media.property.hostId },
        select: { email: true, name: true },
      });
      if (host?.email) {
        void sendMediaRejectedEmail({
          email: host.email,
          name: host.name,
          propertyName: media.property.title,
          mediaType: media.type,
        });
      }
      return { media: { id: media.id, status: media.status } };
    }
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

  /**
   * Admin reviews a host's identity verification: approve or reject.
   */
  app.post(
    '/admin/verification/:id/approve',
    { preHandler: [authenticate, requireRoles(['admin'])] },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const user = await prisma.user.update({
        where: { id },
        data: {
          idVerified: true,
          idVerifiedAt: new Date(),
          verificationStatus: 'verified',
          verificationReviewedAt: new Date(),
          verificationVerdict: 'approved',
          verificationReason: 'manual_approval',
        },
        select: { email: true, name: true, id: true },
      });
      void sendPushToUser(user.id, 'host_bookings', {
        title: 'Identidad verificada / Identity verified',
        body: 'Tu insignia azul ya está activa. / Your blue badge is now active.',
        data: { type: 'verification_approved' },
      });
      if (user.email) {
        void deliverEmail({
          to: user.email,
          subject: 'Identidad verificada / Identity verified',
          html: `
            <h2>Tu identidad ha sido verificada / Your identity has been verified</h2>
            <p>Ya puedes publicar propiedades y recibir reservas en Elevari.</p>
            <p>Your identity has been verified. You can now list properties and receive bookings on Elevari.</p>
          `,
        });
      }
      return { user: { id: user.id, idVerified: true, verificationStatus: 'verified' } };
    }
  );

  app.post(
    '/admin/verification/:id/reject',
    { preHandler: [authenticate, requireRoles(['admin'])] },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const body = z.object({ reason: z.string().trim().min(1).max(500) }).safeParse(request.body);
      if (!body.success) {
        return reply.status(400).send({ error: 'Invalid body' });
      }
      const user = await prisma.user.update({
        where: { id },
        data: {
          verificationStatus: 'rejected',
          verificationReviewedAt: new Date(),
          verificationVerdict: 'rejected',
          verificationReason: body.data.reason,
          idVerified: false,
          idVerifiedAt: null,
        },
        select: { email: true, name: true, id: true },
      });
      void sendPushToUser(user.id, 'host_bookings', {
        title: 'Verificación rechazada / Verification rejected',
        body: 'Puedes volver a enviar tus documentos. / You can resubmit your documents.',
        data: { type: 'verification_rejected' },
      });
      if (user.email) {
        void deliverEmail({
          to: user.email,
          subject: 'Verificación de identidad rechazada / Identity verification rejected',
          html: `
            <h2>Verificación de identidad rechazada / Identity verification rejected</h2>
            <p>${body.data.reason}</p>
            <p>Puedes volver a enviar tus documentos para intentar nuevamente.</p>
            <p>You may resubmit your documents to try again.</p>
          `,
        });
      }
      return { user: { id: user.id, verificationStatus: 'rejected' } };
    }
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
