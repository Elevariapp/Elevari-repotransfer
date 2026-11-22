import type { FastifyInstance } from 'fastify';
import { prisma } from '../lib/prisma.js';
import { turnstileRequired } from '../lib/turnstile.js';

export async function healthRoutes(app: FastifyInstance) {
  app.get('/health', async () => {
    let dbOk = false;
    try {
      await prisma.$queryRaw`SELECT 1`;
      dbOk = true;
    } catch {
      dbOk = false;
    }

    return {
      status: dbOk ? 'ok' : 'degraded',
      service: 'wana-api',
      database: dbOk ? 'connected' : 'disconnected',
      turnstile_required: turnstileRequired(),
      timestamp: new Date().toISOString(),
    };
  });
}
