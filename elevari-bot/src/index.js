import fastify from 'fastify';
import cors from '@fastify/cors';
import formbody from '@fastify/formbody';
import dotenv from 'dotenv';

import { chatRoutes } from './routes/chat.js';
import { webhookRoutes } from './routes/webhook.js';
import { healthRoutes } from './routes/health.js';

dotenv.config();

const app = fastify({ logger: true });

await app.register(cors, { origin: '*' });
await app.register(formbody);

await app.register(healthRoutes, { prefix: '/api/v1/bot' });
await app.register(chatRoutes, { prefix: '/api/v1/bot' });
await app.register(webhookRoutes, { prefix: '/api/v1/bot' });

const PORT = process.env.PORT || 3001;
const HOST = '0.0.0.0';

try {
  await app.listen({ port: PORT, host: HOST });
  app.log.info(`Elevari Bot escuchando en http://${HOST}:${PORT}`);
} catch (err) {
  app.log.error(err);
  process.exit(1);
}