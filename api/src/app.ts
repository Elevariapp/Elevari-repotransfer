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

export async function buildApp() {
  const app = Fastify({
    // The API is only reachable through nginx (port 4000 is not published) and nginx overwrites X-Forwarded-For
    // with the real client IP, so it is safe to trust it. Without this every user shares one rate-limit bucket.
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
    // Server-side calls from the web container (SSR) reach the API directly on the Docker network without
    // X-Forwarded-For; public traffic always carries it (set by nginx). SSR must not be throttled as one "user".
    allowList: (req) =>
      req.url === '/health' ||
      req.url.startsWith('/api/v1/webhooks/') ||
      !req.headers['x-forwarded-for'],
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

  return app;
}
