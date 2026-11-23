import type { FastifyRequest, FastifyReply } from 'fastify';
import type { UserRole } from '@prisma/client';
import { verifyToken, type JwtPayload } from '../lib/auth.js';
import { prisma } from '../lib/prisma.js';

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

  // The JWT alone can't tell us the account was deleted or the password changed since it
  // was issued, so check the user row (primary-key lookup).
  const account = await prisma.user.findUnique({
    where: { id: payload.sub },
    select: { email: true, role: true, deletedAt: true, tokenVersion: true },
  });
  if (!account || account.deletedAt || account.tokenVersion !== payload.tv) {
    return reply
      .status(401)
      .send({ error: 'Tu sesión ya no es válida. Inicia sesión de nuevo.', code: 'session_revoked' });
  }

  request.auth = { ...payload, email: account.email, role: account.role };
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
