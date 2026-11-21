import { checkOllamaHealth } from '../bot/ollama.js';

export async function healthRoutes(fastify) {
  fastify.get('/health', async (request, reply) => {
    const ollamaOk = await checkOllamaHealth();

    return {
      status: 'ok',
      service: 'elevari-bot',
      ollama: ollamaOk ? 'connected' : 'disconnected',
      timestamp: new Date().toISOString(),
    };
  });
}