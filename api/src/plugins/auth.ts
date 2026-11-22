import type { FastifyRequest, FastifyReply } from 'fastify';
import type { UserRole } from '@prisma/client';
import { verifyToken, type JwtPayload } from '../lib/auth.js';

declare module 'fastify' {
  interface FastifyRequest {
    auth?: JwtPayload;
  }
}

export async function authenticate(request: FastifyRequest, reply: FastifyReply) {
  const header = request.headers.authorization;
  const token = header?.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) {
    return reply.status(401).send({ error: 'Authentication required' });
  }

  const payload = await verifyToken(token);
  if (!payload) {
    return reply.status(401).send({ error: 'Invalid or expired token' });
  }

  request.auth = payload;
}

export function requireRoles(roles: UserRole[]) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    if (!request.auth) {
      return reply.status(401).send({ error: 'Authentication required' });
    }
    if (!roles.includes(request.auth.role)) {
      return reply.status(403).send({ error: 'Insufficient permissions' });
    }
  };
}
