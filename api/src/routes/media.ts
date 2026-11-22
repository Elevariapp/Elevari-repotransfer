import type { FastifyInstance } from 'fastify';
import { randomUUID } from 'node:crypto';
import { prisma } from '../lib/prisma.js';
import { uploadBuffer, deleteObject } from '../lib/minio.js';
import {
  processImage,
  IMAGE_TYPES,
  VIDEO_TYPES,
  MAX_IMAGE_BYTES,
  MAX_VIDEO_BYTES,
} from '../lib/media-process.js';
import { authenticate, requireRoles } from '../plugins/auth.js';

function mediaStatus(): 'approved' | 'pending' {
  if (process.env.MEDIA_AUTO_APPROVE === 'true' || process.env.NODE_ENV === 'development') {
    return 'approved';
  }
  return 'pending';
}

async function verifyHostAccess(
  propertyId: string,
  userId: string,
  role: string,
): Promise<{ error: string; status: number } | { ok: true }> {
  const property = await prisma.property.findUnique({ where: { id: propertyId } });
  if (!property) return { error: 'Property not found', status: 404 };
  if (role !== 'admin' && property.hostId !== userId) {
    return { error: 'Not authorized for this property', status: 403 };
  }
  return { ok: true };
}

export async function mediaRoutes(app: FastifyInstance) {
  app.get('/media/property/:propertyId', async (request, reply) => {
    const { propertyId } = request.params as { propertyId: string };

    const media = await prisma.propertyMedia.findMany({
      where: { propertyId, status: 'approved' },
      orderBy: { sortOrder: 'asc' },
    });

    return {
      property_id: propertyId,
      media: media.map((m) => ({
        id: m.id,
        type: m.type,
        url: m.url,
        thumbnail_url: m.thumbnailUrl,
        sort_order: m.sortOrder,
        status: m.status,
        content_type: m.contentType,
        size_bytes: m.sizeBytes,
      })),
    };
  });

  app.post(
    '/media/upload',
    { preHandler: [authenticate, requireRoles(['host', 'admin'])] },
    async (request, reply) => {
      const hostId = request.auth!.sub;

      let propertyId: string | undefined;
      let fileBuffer: Buffer | undefined;
      let mimeType: string | undefined;

      const parts = request.parts();
      for await (const part of parts) {
        if (part.type === 'file') {
          mimeType = part.mimetype;
          fileBuffer = await part.toBuffer();
        } else if (part.fieldname === 'property_id') {
          propertyId = String(part.value);
        }
      }

      if (!propertyId || !fileBuffer || !mimeType) {
        return reply.status(400).send({ error: 'property_id and file are required' });
      }

      const check = await verifyHostAccess(propertyId, hostId, request.auth!.role);
      if ('error' in check) {
        return reply.status(check.status).send({ error: check.error });
      }

      const isImage = IMAGE_TYPES.has(mimeType);
      const isVideo = VIDEO_TYPES.has(mimeType);

      if (!isImage && !isVideo) {
        return reply.status(400).send({ error: 'Unsupported file type' });
      }

      if (isImage && fileBuffer.length > MAX_IMAGE_BYTES) {
        return reply.status(400).send({ error: 'Image exceeds 10MB limit' });
      }
      if (isVideo && fileBuffer.length > MAX_VIDEO_BYTES) {
        return reply.status(400).send({ error: 'Video exceeds 80MB limit' });
      }

      const uuid = randomUUID();
      const prefix = `properties/${propertyId}/${uuid}`;
      const status = mediaStatus();

      try {
        let url: string;
        let thumbnailUrl: string | null = null;

        if (isImage) {
          const processed = await processImage(fileBuffer);
          url = await uploadBuffer(`${prefix}-full.webp`, processed.full, 'image/webp');
          thumbnailUrl = await uploadBuffer(`${prefix}-thumb.webp`, processed.thumb, 'image/webp');
          await uploadBuffer(`${prefix}-card.webp`, processed.card, 'image/webp');
        } else {
          const ext = mimeType === 'video/quicktime' ? 'mov' : mimeType.split('/')[1] ?? 'mp4';
          url = await uploadBuffer(`${prefix}.${ext}`, fileBuffer, mimeType);
        }

        const count = await prisma.propertyMedia.count({ where: { propertyId } });

        const record = await prisma.propertyMedia.create({
          data: {
            propertyId,
            type: isVideo ? 'video' : 'image',
            url,
            thumbnailUrl,
            sortOrder: count,
            status,
            contentType: mimeType,
            sizeBytes: fileBuffer.length,
          },
        });

        return reply.status(201).send({
          media: {
            id: record.id,
            type: record.type,
            url: record.url,
            thumbnail_url: record.thumbnailUrl,
            sort_order: record.sortOrder,
            status: record.status,
          },
        });
      } catch (err) {
        request.log.error(err);
        return reply.status(502).send({
          error: 'Upload failed',
          details: err instanceof Error ? err.message : String(err),
        });
      }
    },
  );

  app.delete(
    '/media/:id',
    { preHandler: [authenticate, requireRoles(['host', 'admin'])] },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const hostId = request.auth!.sub;

      const media = await prisma.propertyMedia.findUnique({
        where: { id },
        include: { property: { select: { hostId: true } } },
      });

      if (!media) {
        return reply.status(404).send({ error: 'Media not found' });
      }
      if (media.property.hostId !== hostId && request.auth!.role !== 'admin') {
        return reply.status(403).send({ error: 'Not authorized' });
      }

      await prisma.propertyMedia.delete({ where: { id } });

      try {
        const urlPath = new URL(media.url).pathname;
        const key = urlPath.split('/wana-media/')[1];
        if (key) await deleteObject(key);
      } catch {
        /* best-effort */
      }

      return { deleted: true };
    },
  );

  app.get(
    '/media/property/:propertyId/manage',
    { preHandler: [authenticate, requireRoles(['host', 'admin'])] },
    async (request, reply) => {
      const { propertyId } = request.params as { propertyId: string };
      const hostId = request.auth!.sub;

      const check = await verifyHostAccess(propertyId, hostId, request.auth!.role);
      if ('error' in check) {
        return reply.status(check.status).send({ error: check.error });
      }

      const media = await prisma.propertyMedia.findMany({
        where: { propertyId },
        orderBy: { sortOrder: 'asc' },
      });

      return {
        property_id: propertyId,
        media: media.map((m) => ({
          id: m.id,
          type: m.type,
          url: m.url,
          thumbnail_url: m.thumbnailUrl,
          sort_order: m.sortOrder,
          status: m.status,
          content_type: m.contentType,
          size_bytes: m.sizeBytes,
        })),
      };
    },
  );
}
