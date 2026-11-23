import type { FastifyInstance, FastifyRequest } from 'fastify';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import {
  hashPassword,
  verifyPassword,
  verifyPasswordAgainstDummy,
  signToken,
  signResetToken,
  verifyResetToken,
  passwordFingerprint,
  safeEqual,
  serializeUser,
} from '../lib/auth.js';
import { publicSiteUrl } from '../lib/email.js';
import { authenticate } from '../plugins/auth.js';
import { requireTurnstile } from '../lib/auth-guards.js';
import { verifyGoogleIdToken } from '../lib/google-auth.js';
import {
  sendAccountDeletedEmail,
  sendPasswordChangedEmail,
  sendPasswordResetEmail,
  sendWelcomeEmail,
} from '../lib/transactional-emails.js';
import {
  DEMO_ACCOUNT_BLOCKED_MESSAGE,
  isDemoAccountLoginBlocked,
} from '../lib/demo-accounts.js';
import { findUserByEmail, normalizeEmail } from '../lib/users.js';
import { anonymizeAccount, countActiveBookings } from '../lib/account-deletion.js';

const email = z.string().trim().email().max(254);

const registerSchema = z.object({
  email,
  password: z.string().min(8).max(128),
  name: z.string().trim().min(1).max(120),
  role: z.enum(['guest', 'host']).default('guest'),
  turnstile_token: z.string().optional(),
});

const loginSchema = z.object({
  email,
  password: z.string().min(1).max(128),
  turnstile_token: z.string().optional(),
});

const googleAuthSchema = z.object({
  credential: z.string().min(10),
  turnstile_token: z.string().optional(),
  role: z.enum(['guest', 'host']).optional(),
});

const PHONE_PATTERN = /^\+?[0-9 ()-]{7,20}$/;

const updateProfileSchema = z
  .object({
    name: z.string().trim().min(1).max(120).optional(),
    // An empty string or null clears the phone number.
    phone: z.union([z.string().trim().regex(PHONE_PATTERN), z.literal(''), z.null()]).optional(),
  })
  .refine((value) => value.name !== undefined || value.phone !== undefined, {
    message: 'Nothing to update',
  });

const changePasswordSchema = z.object({
  // Accounts created with Google have no password yet, so there is nothing to confirm.
  current_password: z.string().max(128).optional(),
  password: z.string().min(8).max(128),
});

const deleteAccountSchema = z.object({
  password: z.string().max(128).optional(),
  confirm_email: z.string().max(254).optional(),
});

const forgotPasswordSchema = z.object({
  email,
});

const resetPasswordSchema = z.object({
  token: z.string().min(10),
  password: z.string().min(8).max(128),
});

function isUniqueViolation(err: unknown): boolean {
  return typeof err === 'object' && err !== null && (err as { code?: unknown }).code === 'P2002';
}

/** Emails are sent in the background; failures are logged without the address. */
function notify(
  request: FastifyRequest,
  label: string,
  task: Promise<{ sent: boolean; reason?: string }>,
) {
  void task
    .then((result) => {
      if (!result.sent) request.log.warn({ reason: result.reason }, `${label} email not sent`);
    })
    .catch((err: unknown) => request.log.error({ err }, `${label} email failed`));
}

export async function authRoutes(app: FastifyInstance) {
  app.post('/auth/register', {
    config: { rateLimit: { max: 10, timeWindow: '1 minute' } },
  }, async (request, reply) => {
    const body = registerSchema.safeParse(request.body);
    if (!body.success) {
      return reply.status(400).send({ error: 'Invalid body', details: body.error.flatten() });
    }

    const { password, name, role, turnstile_token } = body.data;
    const address = normalizeEmail(body.data.email);

    if (isDemoAccountLoginBlocked(address)) {
      return reply.status(403).send({ error: DEMO_ACCOUNT_BLOCKED_MESSAGE });
    }

    if (!(await requireTurnstile(request, reply, turnstile_token))) return;

    const existing = await findUserByEmail(address);
    if (existing) {
      return reply.status(409).send({ error: 'Email already registered', code: 'email_taken' });
    }

    const passwordHash = await hashPassword(password);
    let user;
    try {
      user = await prisma.user.create({
        data: { email: address, name, passwordHash, role },
      });
    } catch (err) {
      if (isUniqueViolation(err)) {
        return reply.status(409).send({ error: 'Email already registered', code: 'email_taken' });
      }
      throw err;
    }

    const token = await signToken(user);

    notify(
      request,
      'Welcome',
      sendWelcomeEmail({ email: user.email, name: user.name ?? '', role: String(user.role) }),
    );

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

    const { password, turnstile_token } = body.data;
    const address = normalizeEmail(body.data.email);

    if (isDemoAccountLoginBlocked(address)) {
      return reply.status(403).send({ error: DEMO_ACCOUNT_BLOCKED_MESSAGE });
    }

    // Challenge first: checking it after the password would tell a bot which guesses were right.
    if (!(await requireTurnstile(request, reply, turnstile_token))) return;

    const user = await findUserByEmail(address);

    if (!user?.passwordHash || user.deletedAt) {
      await verifyPasswordAgainstDummy(password);
      return reply.status(401).send({ error: 'Invalid email or password' });
    }

    const valid = await verifyPassword(password, user.passwordHash);
    if (!valid) {
      return reply.status(401).send({ error: 'Invalid email or password' });
    }

    const token = await signToken(user);

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

    // Matching accounts by email is only safe when Google vouches for that address.
    if (!profile.emailVerified) {
      return reply.status(401).send({
        error: 'Tu correo de Google no está verificado. Verifícalo en Google e intenta de nuevo.',
        code: 'google_email_unverified',
      });
    }

    if (!(await requireTurnstile(request, reply, body.data.turnstile_token))) return;

    if (isDemoAccountLoginBlocked(profile.email)) {
      return reply.status(403).send({ error: DEMO_ACCOUNT_BLOCKED_MESSAGE });
    }

    let user = await findUserByEmail(profile.email);
    let isNewUser = false;

    if (!user) {
      isNewUser = true;
      try {
        user = await prisma.user.create({
          data: {
            email: normalizeEmail(profile.email),
            name: profile.name,
            role: body.data.role ?? 'guest',
            passwordHash: null,
          },
        });
      } catch (err) {
        if (!isUniqueViolation(err)) throw err;
        // Lost a race with a parallel sign-in for the same address.
        user = await findUserByEmail(profile.email);
        isNewUser = false;
        if (!user) throw err;
      }
    }

    const token = await signToken(user);

    if (isNewUser) {
      notify(
        request,
        'Welcome',
        sendWelcomeEmail({ email: user.email, name: user.name ?? '', role: String(user.role) }),
      );
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

  app.patch('/auth/me', {
    preHandler: authenticate,
    config: { rateLimit: { max: 20, timeWindow: '1 minute' } },
  }, async (request, reply) => {
    const body = updateProfileSchema.safeParse(request.body);
    if (!body.success) {
      return reply.status(400).send({ error: 'Invalid body', details: body.error.flatten() });
    }

    const { name, phone } = body.data;
    const user = await prisma.user.update({
      where: { id: request.auth!.sub },
      data: {
        ...(name !== undefined ? { name } : {}),
        ...(phone !== undefined ? { phone: phone === '' ? null : phone } : {}),
      },
    });

    return { user: serializeUser(user) };
  });

  app.post('/auth/change-password', {
    preHandler: authenticate,
    config: { rateLimit: { max: 10, timeWindow: '1 minute' } },
  }, async (request, reply) => {
    const body = changePasswordSchema.safeParse(request.body);
    if (!body.success) {
      return reply.status(400).send({ error: 'Invalid body', details: body.error.flatten() });
    }

    const user = await prisma.user.findUnique({ where: { id: request.auth!.sub } });
    if (!user) {
      return reply.status(401).send({ error: 'Authentication required' });
    }

    // 403 rather than 401: the session is fine, so clients must not treat this as an expired login.
    if (user.passwordHash) {
      const current = body.data.current_password;
      const matches = current ? await verifyPassword(current, user.passwordHash) : false;
      if (!matches) {
        return reply.status(403).send({
          error: 'La contraseña actual no es correcta.',
          code: 'invalid_current_password',
        });
      }
    }

    const passwordHash = await hashPassword(body.data.password);
    const updated = await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        passwordChangedAt: new Date(),
        tokenVersion: { increment: 1 },
      },
    });

    // Every other session (older tokens) is now rejected; hand this device a fresh one.
    const token = await signToken(updated);

    notify(
      request,
      'Password changed',
      sendPasswordChangedEmail({ email: user.email, name: user.name ?? '' }),
    );

    return { success: true, token };
  });

  app.post('/auth/delete-account', {
    preHandler: authenticate,
    config: { rateLimit: { max: 5, timeWindow: '1 minute' } },
  }, async (request, reply) => {
    const body = deleteAccountSchema.safeParse(request.body);
    if (!body.success) {
      return reply.status(400).send({ error: 'Invalid body', details: body.error.flatten() });
    }

    const user = await prisma.user.findUnique({ where: { id: request.auth!.sub } });
    if (!user) {
      return reply.status(401).send({ error: 'Authentication required' });
    }

    if (user.role === 'admin') {
      return reply.status(403).send({
        error: 'Las cuentas de administrador no se pueden eliminar desde la app. Escríbenos y lo gestionamos.',
        code: 'admin_account',
      });
    }

    if (user.passwordHash) {
      const provided = body.data.password;
      const matches = provided ? await verifyPassword(provided, user.passwordHash) : false;
      if (!matches) {
        return reply.status(403).send({
          error: 'La contraseña no es correcta.',
          code: 'invalid_password',
        });
      }
    } else {
      const typed = body.data.confirm_email ? normalizeEmail(body.data.confirm_email) : '';
      if (!typed || !safeEqual(typed, normalizeEmail(user.email))) {
        return reply.status(403).send({
          error: 'El correo no coincide con el de tu cuenta.',
          code: 'invalid_confirmation',
        });
      }
    }

    if ((await countActiveBookings(user.id)) > 0) {
      return reply.status(409).send({
        error: 'Tienes reservas activas o con pago pendiente. Cancélalas o espera a que terminen para eliminar tu cuenta.',
        code: 'active_bookings',
      });
    }

    await anonymizeAccount(user.id);

    // The address is gone from the database now, so mail the one we still hold in memory.
    notify(
      request,
      'Account deleted',
      sendAccountDeletedEmail({ email: user.email, name: user.name }),
    );

    return { success: true };
  });

  app.post('/auth/forgot-password', {
    config: { rateLimit: { max: 5, timeWindow: '1 minute' } },
  }, async (request, reply) => {
    const body = forgotPasswordSchema.safeParse(request.body);
    if (!body.success) {
      return reply.status(400).send({ error: 'Invalid body' });
    }

    const user = await findUserByEmail(body.data.email);

    // Respuesta genérica (no revelar si el email existe)
    const okResponse = {
      success: true,
      message: 'Si el correo está registrado, recibirás un enlace en unos minutos.',
    };

    if (!user?.passwordHash || user.deletedAt) {
      return okResponse;
    }

    const token = await signResetToken(user.id, user.email, user.passwordHash);
    const resetUrl = `${publicSiteUrl()}/auth/reset-password?token=${encodeURIComponent(token)}`;

    const result = await sendPasswordResetEmail({
      email: user.email,
      name: user.name ?? '',
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

  app.post('/auth/reset-password', {
    config: { rateLimit: { max: 10, timeWindow: '1 minute' } },
  }, async (request, reply) => {
    const body = resetPasswordSchema.safeParse(request.body);
    if (!body.success) {
      return reply.status(400).send({ error: 'Invalid body', details: body.error.flatten() });
    }

    const invalidLink = () =>
      reply.status(400).send({ error: 'Enlace inválido o expirado', code: 'invalid_reset_token' });

    const payload = await verifyResetToken(body.data.token);
    if (!payload) return invalidLink();

    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, email: true, name: true, passwordHash: true, deletedAt: true },
    });
    // The token is bound to the password it was issued for, so it works exactly once.
    if (
      !user ||
      user.deletedAt ||
      !user.passwordHash ||
      !safeEqual(passwordFingerprint(user.passwordHash), payload.pwd)
    ) {
      return invalidLink();
    }

    const passwordHash = await hashPassword(body.data.password);
    const updated = await prisma.user.updateMany({
      where: { id: user.id, passwordHash: user.passwordHash },
      data: { passwordHash, passwordChangedAt: new Date(), tokenVersion: { increment: 1 } },
    });
    if (updated.count === 0) return invalidLink();

    notify(
      request,
      'Password changed',
      sendPasswordChangedEmail({ email: user.email, name: user.name ?? '' }),
    );

    return { success: true };
  });

  /** Automated smoke tests only — mock mode + shared secret (no Turnstile). */
  app.post('/auth/smoke-login', async (request, reply) => {
    if (process.env.PAYMENTS_MODE !== 'mock') {
      return reply.status(404).send({ error: 'Not found' });
    }

    const expected = process.env.SMOKE_AUTH_SECRET;
    const provided = request.headers['x-smoke-secret'];
    if (!expected || typeof provided !== 'string' || !safeEqual(provided, expected)) {
      return reply.status(403).send({ error: 'Forbidden' });
    }

    const body = loginSchema.safeParse(request.body);
    if (!body.success) {
      return reply.status(400).send({ error: 'Invalid body', details: body.error.flatten() });
    }

    const user = await findUserByEmail(body.data.email);
    if (!user?.passwordHash || user.deletedAt) {
      return reply.status(401).send({ error: 'Invalid email or password' });
    }

    const valid = await verifyPassword(body.data.password, user.passwordHash);
    if (!valid) {
      return reply.status(401).send({ error: 'Invalid email or password' });
    }

    const token = await signToken(user);
    return { token, user: serializeUser(user) };
  });
}
