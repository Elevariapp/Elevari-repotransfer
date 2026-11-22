import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import {
  hashPassword,
  verifyPassword,
  signToken,
  signResetToken,
  verifyResetToken,
  serializeUser,
} from '../lib/auth.js';
import { publicSiteUrl } from '../lib/email.js';
import { authenticate } from '../plugins/auth.js';
import { requireTurnstile } from '../lib/auth-guards.js';
import { verifyGoogleIdToken } from '../lib/google-auth.js';
import {
  sendPasswordChangedEmail,
  sendPasswordResetEmail,
  sendWelcomeEmail,
} from '../lib/transactional-emails.js';
import {
  DEMO_ACCOUNT_BLOCKED_MESSAGE,
  isDemoAccountLoginBlocked,
} from '../lib/demo-accounts.js';

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(128),
  name: z.string().min(1).max(120),
  role: z.enum(['guest', 'host']).default('guest'),
  turnstile_token: z.string().optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  turnstile_token: z.string().optional(),
});

const googleAuthSchema = z.object({
  credential: z.string().min(10),
  turnstile_token: z.string().optional(),
  role: z.enum(['guest', 'host']).optional(),
});

const changePasswordSchema = z.object({
  password: z.string().min(8).max(128),
});

const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

const resetPasswordSchema = z.object({
  token: z.string().min(10),
  password: z.string().min(8).max(128),
});

export async function authRoutes(app: FastifyInstance) {
  app.post('/auth/register', {
    config: { rateLimit: { max: 10, timeWindow: '1 minute' } },
  }, async (request, reply) => {
    const body = registerSchema.safeParse(request.body);
    if (!body.success) {
      return reply.status(400).send({ error: 'Invalid body', details: body.error.flatten() });
    }

    const { email, password, name, role, turnstile_token } = body.data;

    if (isDemoAccountLoginBlocked(email)) {
      return reply.status(403).send({ error: DEMO_ACCOUNT_BLOCKED_MESSAGE });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return reply.status(409).send({ error: 'Email already registered' });
    }

    if (!(await requireTurnstile(request, reply, turnstile_token))) return;

    const passwordHash = await hashPassword(password);
    const user = await prisma.user.create({
      data: { email, name, passwordHash, role },
    });

    const token = await signToken({ id: user.id, email: user.email, role: user.role });

    sendWelcomeEmail({ email: user.email, name: user.name, role: user.role }).then((result) => {
      if (!result.sent) {
        request.log.warn({ reason: result.reason, email: user.email }, 'Welcome email not sent');
      }
    });

    return reply.status(201).send({
      token,
      user: serializeUser(user),
    });
  });

  app.post('/auth/login', {
    config: { rateLimit: { max: 15, timeWindow: '1 minute' } },
  }, async (request, reply) => {
    const body = loginSchema.safeParse(request.body);
    if (!body.success) {
      return reply.status(400).send({ error: 'Invalid body', details: body.error.flatten() });
    }

    const { email, password, turnstile_token } = body.data;

    if (isDemoAccountLoginBlocked(email)) {
      return reply.status(403).send({ error: DEMO_ACCOUNT_BLOCKED_MESSAGE });
    }

    const user = await prisma.user.findUnique({ where: { email } });

    if (!user?.passwordHash) {
      return reply.status(401).send({ error: 'Invalid email or password' });
    }

    const valid = await verifyPassword(password, user.passwordHash);
    if (!valid) {
      return reply.status(401).send({ error: 'Invalid email or password' });
    }

    if (!(await requireTurnstile(request, reply, turnstile_token))) return;

    const token = await signToken({ id: user.id, email: user.email, role: user.role });

    return {
      token,
      user: serializeUser(user),
    };
  });

  app.post('/auth/google', {
    config: { rateLimit: { max: 15, timeWindow: '1 minute' } },
  }, async (request, reply) => {
    const body = googleAuthSchema.safeParse(request.body);
    if (!body.success) {
      return reply.status(400).send({ error: 'Invalid body', details: body.error.flatten() });
    }

    const profile = await verifyGoogleIdToken(body.data.credential);
    if (!profile) {
      return reply.status(401).send({ error: 'Google sign-in failed' });
    }

    if (!(await requireTurnstile(request, reply, body.data.turnstile_token))) return;

    if (isDemoAccountLoginBlocked(profile.email)) {
      return reply.status(403).send({ error: DEMO_ACCOUNT_BLOCKED_MESSAGE });
    }

    let user = await prisma.user.findUnique({ where: { email: profile.email } });
    let isNewUser = false;

    if (!user) {
      isNewUser = true;
      user = await prisma.user.create({
        data: {
          email: profile.email,
          name: profile.name,
          role: body.data.role ?? 'guest',
          passwordHash: null,
        },
      });
    }

    const token = await signToken({ id: user.id, email: user.email, role: user.role });

    if (isNewUser) {
      sendWelcomeEmail({ email: user.email, name: user.name, role: user.role }).then((result) => {
        if (!result.sent) {
          request.log.warn({ reason: result.reason, email: user.email }, 'Welcome email not sent');
        }
      });
    }

    return {
      token,
      user: serializeUser(user),
      is_new_user: isNewUser,
    };
  });

  app.get('/auth/me', { preHandler: authenticate }, async (request) => {
    const user = await prisma.user.findUnique({
      where: { id: request.auth!.sub },
    });

    if (!user) {
      return { user: null };
    }

    return { user: serializeUser(user) };
  });

  app.post('/auth/change-password', { preHandler: authenticate }, async (request, reply) => {
    const body = changePasswordSchema.safeParse(request.body);
    if (!body.success) {
      return reply.status(400).send({ error: 'Invalid body', details: body.error.flatten() });
    }

    const passwordHash = await hashPassword(body.data.password);
    await prisma.user.update({
      where: { id: request.auth!.sub },
      data: { passwordHash },
    });

    const user = await prisma.user.findUnique({
      where: { id: request.auth!.sub },
      select: { email: true, name: true },
    });
    if (user) {
      sendPasswordChangedEmail({ email: user.email, name: user.name }).then((result) => {
        if (!result.sent) {
          request.log.warn({ reason: result.reason }, 'Password changed email not sent');
        }
      });
    }

    return { success: true };
  });

  app.post('/auth/forgot-password', {
    config: { rateLimit: { max: 5, timeWindow: '1 minute' } },
  }, async (request, reply) => {
    const body = forgotPasswordSchema.safeParse(request.body);
    if (!body.success) {
      return reply.status(400).send({ error: 'Invalid body' });
    }

    const user = await prisma.user.findUnique({ where: { email: body.data.email } });

    // Respuesta genérica (no revelar si el email existe)
    const okResponse = {
      success: true,
      message: 'Si el correo está registrado, recibirás un enlace en unos minutos.',
    };

    if (!user?.passwordHash) {
      return okResponse;
    }

    const token = await signResetToken(user.id, user.email);
    const resetUrl = `${publicSiteUrl()}/auth/reset-password?token=${encodeURIComponent(token)}`;

    const result = await sendPasswordResetEmail({
      email: user.email,
      name: user.name,
      resetUrl,
    });
    if (!result.sent) {
      request.log.warn({ reason: result.reason }, 'Password reset email not sent');
      return reply.status(503).send({
        error: 'No se pudo enviar el correo. Intenta más tarde o cambia la contraseña desde tu cuenta.',
      });
    }

    return okResponse;
  });

  app.post('/auth/reset-password', async (request, reply) => {
    const body = resetPasswordSchema.safeParse(request.body);
    if (!body.success) {
      return reply.status(400).send({ error: 'Invalid body', details: body.error.flatten() });
    }

    const payload = await verifyResetToken(body.data.token);
    if (!payload) {
      return reply.status(400).send({ error: 'Enlace inválido o expirado' });
    }

    const passwordHash = await hashPassword(body.data.password);
    const user = await prisma.user.update({
      where: { id: payload.sub },
      data: { passwordHash },
      select: { email: true, name: true },
    });

    sendPasswordChangedEmail({ email: user.email, name: user.name }).then((result) => {
      if (!result.sent) {
        request.log.warn({ reason: result.reason }, 'Password changed email not sent');
      }
    });

    return { success: true };
  });

  /** Automated smoke tests only — mock mode + shared secret (no Turnstile). */
  app.post('/auth/smoke-login', async (request, reply) => {
    if (process.env.PAYMENTS_MODE !== 'mock') {
      return reply.status(404).send({ error: 'Not found' });
    }

    const expected = process.env.SMOKE_AUTH_SECRET;
    const provided = request.headers['x-smoke-secret'];
    if (!expected || provided !== expected) {
      return reply.status(403).send({ error: 'Forbidden' });
    }

    const body = loginSchema.safeParse(request.body);
    if (!body.success) {
      return reply.status(400).send({ error: 'Invalid body', details: body.error.flatten() });
    }

    const { email, password } = body.data;
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user?.passwordHash) {
      return reply.status(401).send({ error: 'Invalid email or password' });
    }

    const valid = await verifyPassword(password, user.passwordHash);
    if (!valid) {
      return reply.status(401).send({ error: 'Invalid email or password' });
    }

    const token = await signToken({ id: user.id, email: user.email, role: user.role });
    return { token, user: serializeUser(user) };
  });
}
