import Fastify from 'fastify';
import cors from '@fastify/cors';
import multipart from '@fastify/multipart';
import rateLimit from '@fastify/rate-limit';
import { randomUUID } from 'node:crypto';
import { healthRoutes } from './routes/health.js';
import { propertyRoutes } from './routes/properties.js';
import { bookingRoutes } from './routes/bookings.js';
import { paymentRoutes, webhookRoutes } from './routes/payments.js';
import { mediaRoutes } from './routes/media.js';
import { authRoutes } from './routes/auth.js';
import { adminRoutes } from './routes/admin.js';
import { financialRoutes } from './routes/financial.js';
import { hostRoutes } from './routes/host.js';
import { analyticsRoutes } from './routes/analytics.js';
import { accountRoutes } from './routes/account.js';
import { notificationRoutes } from './routes/notifications.js';

export async function buildApp() {
  const app = Fastify({
    // The API only listens on the internal network, behind nginx, which sets a single
    // X-Forwarded-For hop (the real client address). Without this every visitor shares the
    // proxy's address and therefore one rate-limit bucket.
    trustProxy: true,
    // Structured logs with request correlation and secret redaction.
    logger: {
      level: process.env.LOG_LEVEL ?? 'info',
      redact: {
        paths: [
          'req.headers.authorization',
          'req.headers.cookie',
          'res.headers["set-cookie"]',
          'req.headers["x-wompi-signature"]',
        ],
        censor: '[redacted]',
      },
    },
    genReqId: (req) => {
      const incoming = req.headers['x-request-id'];
      return (Array.isArray(incoming) ? incoming[0] : incoming) ?? randomUUID();
    },
    requestIdHeader: 'x-request-id',
  });

  // Browsers and the apps send `Content-Type: application/json` even on POSTs without a body
  // (cancel a booking, approve media...). Fastify rejects that with a 400 by default, so treat an
  // empty body as "no body" and keep its stock parser (with prototype-poisoning protection) for the rest.
  const parseJson = app.getDefaultJsonParser('error', 'error');
  app.addContentTypeParser('application/json', { parseAs: 'string' }, (request, body, done) => {
    if (body === '') {
      done(null, undefined);
      return;
    }
    parseJson(request, body as string, done);
  });

  await app.register(cors, {
    origin: (origin, callback) => {
      const configured = (process.env.CORS_ORIGIN ?? 'http://localhost:3000')
        .split(',')
        .map((value) => value.trim())
        .filter(Boolean);
      const allowed = new Set(configured);
      // Apex + www (Cloudflare) — evita fallos CORS al iniciar sesión
      allowed.add('https://elevari.live');
      allowed.add('https://www.elevari.live');

      if (!origin || allowed.has(origin)) {
        callback(null, origin ?? true);
        return;
      }
      callback(null, false);
    },
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  await app.register(multipart, {
    limits: {
      fileSize: 80 * 1024 * 1024,
      files: 1,
    },
  });

  await app.register(rateLimit, {
    global: true,
    max: 120,
    timeWindow: '1 minute',
    allowList: (req) => req.url === '/health' || req.url.startsWith('/api/v1/webhooks/'),
  });

  await app.register(healthRoutes);
  await app.register(propertyRoutes, { prefix: '/api/v1' });
  await app.register(bookingRoutes, { prefix: '/api/v1' });
  await app.register(paymentRoutes, { prefix: '/api/v1' });
  await app.register(webhookRoutes, { prefix: '/api/v1' });
  await app.register(mediaRoutes, { prefix: '/api/v1' });
  await app.register(authRoutes, { prefix: '/api/v1' });
  await app.register(hostRoutes, { prefix: '/api/v1' });
  await app.register(adminRoutes, { prefix: '/api/v1' });
  await app.register(financialRoutes, { prefix: '/api/v1' });
  await app.register(analyticsRoutes, { prefix: '/api/v1' });
  await app.register(accountRoutes, { prefix: '/api/v1' });
  await app.register(notificationRoutes, { prefix: '/api/v1' });

  return app;
}
