export async function authMiddleware(fastify) {
  fastify.addHook('onRequest', async (request, reply) => {
    const publicRoutes = ['/api/v1/bot/health', '/api/v1/bot/webhook/whatsapp'];
    if (publicRoutes.includes(request.routerPath)) {
      return;
    }

    const authHeader = request.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return reply.status(401).send({ error: 'Token de autorización requerido' });
    }

    // Validar token contra Elevari (reusar lógica existente)
    // const token = authHeader.split(' ')[1];
    // await verifyToken(token);
  });
}