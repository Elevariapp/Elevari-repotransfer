export async function webhookRoutes(fastify) {
  // Verificación de webhook de WhatsApp (Meta Cloud API)
  fastify.get('/webhook/whatsapp', async (request, reply) => {
    const { 'hub.mode': mode, 'hub.verify_token': verifyToken, 'hub.challenge': challenge } = request.query;

    if (mode && verifyToken) {
      if (mode === 'subscribe' && verifyToken === process.env.WHATSAPP_VERIFY_TOKEN) {
        return reply.status(200).send(challenge);
      }
      return reply.status(403).send({ error: 'Token de verificación inválido' });
    }

    return reply.status(400).send({ error: 'Parámetros faltantes' });
  });

  // Recepción de mensajes de WhatsApp
  fastify.post('/webhook/whatsapp', async (request, reply) => {
    try {
      const body = request.body;

      // Meta envía notificaciones en un objeto 'entry'
      if (body.object === 'whatsapp_business_account') {
        for (const entry of body.entry) {
          for (const change of entry.changes) {
            if (change.field === 'messages') {
              const value = change.value;

              for (const message of value.messages || []) {
                const from = message.from; // Número de teléfono del usuario
                const text = message.text?.body || '';

                // Aquí se integraría con el endpoint /chat
                // Por ahora se registra el mensaje recibido
                fastify.log.info(`WhatsApp mensaje de ${from}: ${text}`);
              }
            }
          }
        }
      }

      return reply.status(200).send({ status: 'received' });
    } catch (err) {
      fastify.log.error(err);
      return reply.status(500).send({ error: 'Error procesando webhook' });
    }
  });
}