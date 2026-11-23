import type { FastifyInstance } from 'fastify';
import type { Readable } from 'node:stream';
import { randomUUID } from 'node:crypto';
import { prisma } from '../lib/prisma.js';
import { uploadBuffer, deleteObject, keyFromPublicUrl, StorageError } from '../lib/minio.js';
import {
  processImage,
  hasVideoSignature,
  InvalidImageError,
  IMAGE_TYPES,
  VIDEO_TYPES,
  MAX_IMAGE_BYTES,
  MAX_VIDEO_BYTES,
} from '../lib/media-process.js';
import { authenticate, requireRoles } from '../plugins/auth.js';

const MAX_MEDIA_PER_PROPERTY = 60;

function mediaStatus(): 'approved' | 'pending' {
  if (process.env.MEDIA_AUTO_APPROVE === 'true' || process.env.NODE_ENV === 'development') {
    return 'approved';
  }
  return 'pending';
}

function mediaError(code: string, error: string) {
  return { error, code };
}

const PROPERTY_NOT_FOUND = mediaError('PROPERTY_NOT_FOUND', 'No encontramos esta propiedad.');
const MEDIA_NOT_FOUND = mediaError('MEDIA_NOT_FOUND', 'No encontramos este archivo.');

/** Hosts can only touch their own properties; anyone else gets the same answer as for a missing id. */
async function canManageProperty(propertyId: string, userId: string, role: string): Promise<boolean> {
  if (!propertyId || propertyId.length > 64) return false;
  const property = await prisma.property.findUnique({
    where: { id: propertyId },
    select: { hostId: true },
  });
  return Boolean(property) && (role === 'admin' || property!.hostId === userId);
}

const EXTENSION_TYPES: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  gif: 'image/gif',
  mp4: 'video/mp4',
  webm: 'video/webm',
  mov: 'video/quicktime',
};

/** Some browsers send no type for .mov/.webm files; fall back to the extension (content is still verified). */
function resolveMimeType(declared: string, filename?: string): string {
  const type = declared.split(';')[0].trim().toLowerCase();
  if (type && type !== 'application/octet-stream') return type;
  const extension = filename?.split('.').pop()?.toLowerCase() ?? '';
  return EXTENSION_TYPES[extension] ?? type;
}

/**
 * Reads an upload stream into memory up to `maxBytes`. Anything beyond the limit is drained
 * without buffering so the client still receives a JSON error instead of a reset connection.
 */
async function readUpload(file: Readable & { truncated?: boolean }, maxBytes: number) {
  const chunks: Buffer[] = [];
  let size = 0;
  for await (const chunk of file) {
    size += chunk.length;
    if (size <= maxBytes) chunks.push(chunk as Buffer);
  }
  return {
    buffer: size <= maxBytes ? Buffer.concat(chunks, size) : null,
    truncated: Boolean(file.truncated),
  };
}

function mediaItem(m: {
  id: string;
  type: string;
  url: string;
  thumbnailUrl: string | null;
  sortOrder: number;
  status: string;
  contentType: string | null;
  sizeBytes: number | null;
}) {
  return {
    id: m.id,
    type: m.type,
    url: m.url,
    thumbnail_url: m.thumbnailUrl,
    sort_order: m.sortOrder,
    status: m.status,
    content_type: m.contentType,
    size_bytes: m.sizeBytes,
  };
}

export async function mediaRoutes(app: FastifyInstance) {
  // Unexpected failures must not leak Prisma/driver details to the client.
  app.setErrorHandler((error, request, reply) => {
    const statusCode = (error as { statusCode?: number }).statusCode;
    if (statusCode && statusCode < 500) return reply.send(error);
    request.log.error({ err: error }, 'media request failed');
    return reply
      .status(500)
      .send(mediaError('MEDIA_REQUEST_FAILED', 'No pudimos completar la solicitud. Inténtalo de nuevo en unos minutos.'));
  });

  app.get('/media/property/:propertyId', async (request, reply) => {
    const { propertyId } = request.params as { propertyId: string };

    const media = await prisma.propertyMedia.findMany({
      where: { propertyId, status: 'approved' },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    });

    return {
      property_id: propertyId,
      media: media.map(mediaItem),
    };
  });

  app.post(
    '/media/upload',
    { preHandler: [authenticate, requireRoles(['host', 'admin'])] },
    async (request, reply) => {
      if (!request.isMultipart()) {
        return reply
          .status(415)
          .send(mediaError('INVALID_UPLOAD', 'Envía el archivo como multipart/form-data.'));
      }

      const userId = request.auth!.sub;
      const role = request.auth!.role;

      let propertyId: string | undefined;
      let allowed: boolean | undefined;
      let rejection: { status: number; body: ReturnType<typeof mediaError> } | undefined;
      let upload: { buffer: Buffer; mimeType: string } | undefined;

      try {
        for await (const part of request.parts()) {
          if (part.type === 'field') {
            if (part.fieldname === 'property_id' && typeof part.value === 'string') {
              propertyId = part.value.trim();
            }
            continue;
          }

          const mimeType = resolveMimeType(part.mimetype, part.filename);
          const isImage = IMAGE_TYPES.has(mimeType);
          const isVideo = VIDEO_TYPES.has(mimeType);

          // property_id normally arrives first: check ownership before buffering the file.
          if (propertyId !== undefined && allowed === undefined) {
            allowed = await canManageProperty(propertyId, userId, role);
          }

          if (allowed === false) {
            rejection ??= { status: 404, body: PROPERTY_NOT_FOUND };
            part.file.resume();
          } else if (!isImage && !isVideo) {
            rejection ??= {
              status: 415,
              body: mediaError(
                'UNSUPPORTED_FILE_TYPE',
                'Formato no admitido. Usa imágenes JPG, PNG, WebP o GIF, o videos MP4, WebM o MOV.',
              ),
            };
            part.file.resume();
          } else {
            const { buffer, truncated } = await readUpload(
              part.file,
              isImage ? MAX_IMAGE_BYTES : MAX_VIDEO_BYTES,
            );
            if (!buffer || truncated) {
              rejection ??= {
                status: 413,
                body: mediaError(
                  'FILE_TOO_LARGE',
                  isImage ? 'La imagen supera el máximo de 10 MB.' : 'El video supera el máximo de 80 MB.',
                ),
              };
            } else {
              upload = { buffer, mimeType };
            }
          }
        }
      } catch (err) {
        const code = (err as { code?: string }).code;
        if (code === 'FST_REQ_FILE_TOO_LARGE') {
          return reply.status(413).send(mediaError('FILE_TOO_LARGE', 'El archivo supera el máximo de 80 MB.'));
        }
        if (code === 'FST_FILES_LIMIT') {
          return reply
            .status(400)
            .send(mediaError('INVALID_UPLOAD', 'Sube un solo archivo por solicitud.'));
        }
        if (typeof code === 'string' && code.startsWith('FST_')) {
          return reply
            .status(400)
            .send(mediaError('INVALID_UPLOAD', 'La subida no es válida. Inténtalo de nuevo.'));
        }
        throw err;
      }

      if (rejection) {
        return reply.status(rejection.status).send(rejection.body);
      }
      if (!propertyId || !upload) {
        return reply
          .status(400)
          .send(mediaError('INVALID_UPLOAD', 'Indica la propiedad y adjunta un archivo.'));
      }
      // The file can arrive before property_id; ownership is still enforced before anything is stored.
      allowed ??= await canManageProperty(propertyId, userId, role);
      if (!allowed) {
        return reply.status(404).send(PROPERTY_NOT_FOUND);
      }

      const { buffer: fileBuffer, mimeType } = upload;
      const isImage = IMAGE_TYPES.has(mimeType);

      if (!isImage && !hasVideoSignature(fileBuffer, mimeType)) {
        return reply
          .status(400)
          .send(mediaError('INVALID_VIDEO', 'El archivo no parece un video válido (MP4, WebM o MOV).'));
      }

      const existing = await prisma.propertyMedia.aggregate({
        where: { propertyId },
        _count: { _all: true },
        _max: { sortOrder: true },
      });
      if (existing._count._all >= MAX_MEDIA_PER_PROPERTY) {
        return reply
          .status(409)
          .send(
            mediaError(
              'MEDIA_LIMIT_REACHED',
              `Esta propiedad ya tiene el máximo de ${MAX_MEDIA_PER_PROPERTY} archivos. Elimina alguno para subir más.`,
            ),
          );
      }

      const uuid = randomUUID();
      const prefix = `properties/${propertyId}/${uuid}`;
      const status = mediaStatus();
      const storedKeys: string[] = [];
      const store = async (key: string, body: Buffer, contentType: string) => {
        const publicUrl = await uploadBuffer(key, body, contentType);
        storedKeys.push(key);
        return publicUrl;
      };

      try {
        let url: string;
        let thumbnailUrl: string | null = null;

        if (isImage) {
          const processed = await processImage(fileBuffer);
          url = await store(`${prefix}-full.webp`, processed.full, 'image/webp');
          thumbnailUrl = await store(`${prefix}-thumb.webp`, processed.thumb, 'image/webp');
          await store(`${prefix}-card.webp`, processed.card, 'image/webp');
        } else {
          const ext = mimeType === 'video/quicktime' ? 'mov' : mimeType.split('/')[1] ?? 'mp4';
          url = await store(`${prefix}.${ext}`, fileBuffer, mimeType);
        }

        const record = await prisma.propertyMedia.create({
          data: {
            propertyId,
            type: isImage ? 'image' : 'video',
            url,
            thumbnailUrl,
            sortOrder: (existing._max.sortOrder ?? -1) + 1,
            status,
            contentType: mimeType,
            sizeBytes: fileBuffer.length,
          },
        });

        return reply.status(201).send({ media: mediaItem(record) });
      } catch (err) {
        // Never leave orphaned objects in the bucket when the upload only partially succeeded.
        await Promise.allSettled(storedKeys.map((key) => deleteObject(key)));

        if (err instanceof InvalidImageError) {
          return reply
            .status(400)
            .send(mediaError('INVALID_IMAGE', 'No pudimos leer la imagen. Sube un JPG, PNG, WebP o GIF válido.'));
        }
        request.log.error({ err }, 'media upload failed');
        if (err instanceof StorageError) {
          return reply
            .status(503)
            .send(
              mediaError(
                'STORAGE_UNAVAILABLE',
                'El almacenamiento de archivos no está disponible por ahora. Inténtalo de nuevo en unos minutos.',
              ),
            );
        }
        return reply
          .status(500)
          .send(mediaError('UPLOAD_FAILED', 'No pudimos guardar el archivo. Inténtalo de nuevo.'));
      }
    },
  );

  app.delete(
    '/media/:id',
    { preHandler: [authenticate, requireRoles(['host', 'admin'])] },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const userId = request.auth!.sub;

      const media = await prisma.propertyMedia.findUnique({
        where: { id },
        include: { property: { select: { hostId: true } } },
      });

      if (!media || (request.auth!.role !== 'admin' && media.property.hostId !== userId)) {
        return reply.status(404).send(MEDIA_NOT_FOUND);
      }

      // deleteMany: a double click (second request) must not turn into a 500.
      await prisma.propertyMedia.deleteMany({ where: { id } });

      // Remove every stored variant (full, thumbnail and card) so nothing stays reachable by URL.
      const keys = new Set<string>();
      const mainKey = keyFromPublicUrl(media.url);
      if (mainKey) {
        keys.add(mainKey);
        if (mainKey.endsWith('-full.webp')) keys.add(mainKey.replace(/-full\.webp$/, '-card.webp'));
      }
      const thumbKey = media.thumbnailUrl ? keyFromPublicUrl(media.thumbnailUrl) : null;
      if (thumbKey) keys.add(thumbKey);

      // Best-effort and not awaited: storage trouble must not block or fail the delete.
      void Promise.allSettled([...keys].map((key) => deleteObject(key))).then((results) => {
        for (const result of results) {
          if (result.status === 'rejected') {
            request.log.warn({ err: result.reason, mediaId: id }, 'media object cleanup failed');
          }
        }
      });

      return { deleted: true };
    },
  );

  app.get(
    '/media/property/:propertyId/manage',
    { preHandler: [authenticate, requireRoles(['host', 'admin'])] },
    async (request, reply) => {
      const { propertyId } = request.params as { propertyId: string };

      if (!(await canManageProperty(propertyId, request.auth!.sub, request.auth!.role))) {
        return reply.status(404).send(PROPERTY_NOT_FOUND);
      }

      const media = await prisma.propertyMedia.findMany({
        where: { propertyId },
        orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
      });

      return {
        property_id: propertyId,
        media: media.map(mediaItem),
      };
    },
  );
}
