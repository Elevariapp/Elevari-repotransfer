import type { FastifyInstance } from 'fastify';
import { prisma } from '../lib/prisma.js';
import { turnstileRequired } from '../lib/turnstile.js';
import { isEmailDeliveryAvailable } from '../lib/email.js';

export async function healthRoutes(app: FastifyInstance) {
  app.get('/health', async () => {
    let dbOk = false;
    try {
      await prisma.$queryRaw`SELECT 1`;
      dbOk = true;
    } catch {
      dbOk = false;
    }

    const emailConfigured = isEmailDeliveryAvailable();

    return {
      status: dbOk ? 'ok' : 'degraded',
      service: 'wana-api',
      database: dbOk ? 'connected' : 'disconnected',
      turnstile_required: turnstileRequired(),
      email: emailConfigured ? 'configured' : 'not_configured',
      timestamp: new Date().toISOString(),
    };
  });
}
