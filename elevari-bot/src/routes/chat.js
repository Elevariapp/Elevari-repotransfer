import { generateCompletion, generateEmbedding } from '../bot/ollama.js';
import { SYSTEM_PROMPT, buildMessages } from '../bot/prompt.js';
import { config } from '../config/index.js';

// Almacenamiento en memoria temporal (reemplazar por PostgreSQL/Prisma en producción)
const sessions = new Map();

export async function chatRoutes(fastify) {
  fastify.post('/chat', async (request, reply) => {
    try {
      const { channel, channel_user_id, user_id, message, context = {} } = request.body;

      if (!channel || !channel_user_id || !message) {
        return reply.status(400).send({ error: 'Faltan campos requeridos: channel, channel_user_id, message' });
      }

      // Buscar o crear sesión
      const sessionKey = `${channel}:${channel_user_id}`;
      let session = sessions.get(sessionKey);

      if (!session) {
        session = {
          id: crypto.randomUUID(),
          channel,
          channel_user_id,
          user_id,
          status: 'active',
          context,
          history: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        sessions.set(sessionKey, session);
      }

      // Guardar mensaje del usuario
      session.history.push({ role: 'user', content: message, timestamp: new Date() });
      session.updatedAt = new Date();

      // Construir mensajes para Ollama
      const messages = buildMessages(SYSTEM_PROMPT, session.history, message);

      // Generar respuesta con Ollama
      const responseText = await generateCompletion(messages);

      // Guardar respuesta del asistente
      session.history.push({ role: 'assistant', content: responseText, timestamp: new Date() });

      return {
        session_id: session.id,
        channel,
        response: responseText,
        context: session.context,
        timestamp: new Date().toISOString(),
      };
    } catch (err) {
      fastify.log.error(err);
      return reply.status(500).send({ error: 'Error interno del bot' });
    }
  });

  fastify.get('/sessions/:sessionId', async (request, reply) => {
    const { sessionId } = request.params;
    const session = Array.from(sessions.values()).find((s) => s.id === sessionId);

    if (!session) {
      return reply.status(404).send({ error: 'Sesión no encontrada' });
    }

    return session;
  });
}