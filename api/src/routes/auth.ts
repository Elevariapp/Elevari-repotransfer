import type { FastifyInstance, FastifyRequest } from 'fastify';
import { randomUUID } from 'node:crypto';
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
import { isEmailDeliveryAvailable, publicSiteUrl } from '../lib/email.js';
import { createAttemptLimiter } from '../lib/attempt-limiter.js';
import { authenticate, requireRoles } from '../plugins/auth.js';
import { requireTurnstile } from '../lib/auth-guards.js';
import { verifyGoogleIdToken } from '../lib/google-auth.js';
import {
  moderateIdentityBuffers,
  reviewDeadline,
  type IdentityModerationResult,
} from '../lib/ai-moderation.js';
import { IMAGE_TYPES, MAX_IMAGE_BYTES } from '../lib/media-process.js';
import { uploadPrivateBuffer } from '../lib/minio.js';
import { sendPushToUser } from '../lib/push.js';
import { deliverEmail } from '../lib/email.js';
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

// Per-account limits on top of the per-IP ones: wrong passwords per address (a botnet rotating IPs
// is still slowed down) and reset e-mails per account (nobody can flood an inbox).
const loginFailures = createAttemptLimiter({ max: 10, windowMs: 15 * 60_000 });
const resetEmailRequests = createAttemptLimiter({ max: 3, windowMs: 60 * 60_000 });

function waitLabel(seconds: number): string {
  const minutes = Math.max(1, Math.ceil(seconds / 60));
  return minutes === 1 ? '1 minuto' : `${minutes} minutos`;
}

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

    // Keyed by the submitted address whether or not it exists, so the lock reveals nothing.
    const lock = loginFailures.peek(address);
    if (lock.blocked) {
      return reply.header('Retry-After', String(lock.retryAfterSeconds)).status(429).send({
        error: `Demasiados intentos fallidos. Por seguridad, espera ${waitLabel(lock.retryAfterSeconds)} e inténtalo de nuevo o restablece tu contraseña.`,
        code: 'login_locked',
        retry_after_seconds: lock.retryAfterSeconds,
      });
    }

    // Challenge first: checking it after the password would tell a bot which guesses were right.
    if (!(await requireTurnstile(request, reply, turnstile_token))) return;

    const user = await findUserByEmail(address);

    if (!user?.passwordHash || user.deletedAt) {
      await verifyPasswordAgainstDummy(password);
      loginFailures.hit(address);
      return reply.status(401).send({ error: 'Invalid email or password' });
    }

    const valid = await verifyPassword(password, user.passwordHash);
    if (!valid) {
      loginFailures.hit(address);
      return reply.status(401).send({ error: 'Invalid email or password' });
    }

    loginFailures.reset(address);
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

  /**
   * A guest turns their account into a host account. API role checks read the database, but the
   * web route guard trusts the role inside the JWT, so the caller gets a fresh token. Hosts and
   * admins keep their role and just get a token again, which makes a repeated call harmless.
   */
  app.post('/auth/become-host', {
    preHandler: authenticate,
    config: { rateLimit: { max: 5, timeWindow: '1 minute' } },
  }, async (request, reply) => {
    const current = await prisma.user.findUnique({ where: { id: request.auth!.sub } });
    if (!current || current.deletedAt) {
      return reply.status(401).send({ error: 'Authentication required' });
    }

    const user =
      current.role === 'guest'
        ? await prisma.user.update({ where: { id: current.id }, data: { role: 'host' } })
        : current;

    const token = await signToken(user);
    return { token, user: serializeUser(user) };
  });

  /**
   * Host submits identity verification (Airbnb-style): government ID document + selfie.
   *
   * Accepts multipart/form-data (`document` + `selfie` files — preferred: the bytes are read
   * straight into Google Vision and only the private bucket ever stores them) or JSON with URLs
   * (legacy path, always reviewed by a person).
   *
   * Vision decides in seconds. Anything it is unsure about is queued with a one-hour deadline
   * (`REVIEW_SLA_MS`), which replaces the old 48-hour manual queue.
   */
  app.post('/auth/verify-host', {
    preHandler: [authenticate, requireRoles(['host'])],
    config: { rateLimit: { max: 3, timeWindow: '1 hour' } },
  }, async (request, reply) => {
    const userId = request.auth!.sub;
    const existing = await prisma.user.findUnique({
      where: { id: userId },
      select: { verificationStatus: true, idVerified: true },
    });
    if (!existing) {
      return reply.status(404).send({ error: 'User not found' });
    }
    if (existing.idVerified) {
      return reply.status(409).send({ error: 'Ya estás verificado', code: 'already_verified' });
    }
    if (existing.verificationStatus === 'pending') {
      return reply.status(409).send({ error: 'Ya tienes una verificación pendiente', code: 'verification_pending' });
    }

    let idNumber = '';
    let fullName = '';
    let documentBuffer: Buffer | null = null;
    let selfieBuffer: Buffer | null = null;
    let documentRef: string | null = null;
    let selfieRef: string | null = null;

    if (request.isMultipart()) {
      try {
        for await (const part of request.parts()) {
          if (part.type === 'field') {
            const value = typeof part.value === 'string' ? part.value.trim() : '';
            if (part.fieldname === 'id_number') idNumber = value;
            if (part.fieldname === 'full_name') fullName = value;
            continue;
          }
          if (part.fieldname !== 'document' && part.fieldname !== 'selfie') {
            part.file.resume();
            continue;
          }
          const mimeType = (part.mimetype || '').split(';')[0].trim().toLowerCase();
          if (!IMAGE_TYPES.has(mimeType)) {
            part.file.resume();
            return reply.status(415).send({
              error: 'El documento y la selfie deben ser imágenes JPG, PNG o WebP.',
              code: 'unsupported_file_type',
            });
          }
          const chunks: Buffer[] = [];
          let size = 0;
          let tooBig = false;
          for await (const chunk of part.file) {
            size += chunk.length;
            if (size > MAX_IMAGE_BYTES) {
              tooBig = true;
              continue;
            }
            chunks.push(chunk as Buffer);
          }
          if (tooBig) {
            return reply.status(413).send({ error: 'Cada archivo debe pesar máximo 10 MB.', code: 'file_too_large' });
          }
          const buffer = Buffer.concat(chunks, size);
          if (part.fieldname === 'document') documentBuffer = buffer;
          else selfieBuffer = buffer;
        }
      } catch {
        return reply.status(400).send({ error: 'La subida no es válida. Inténtalo de nuevo.', code: 'invalid_upload' });
      }
    } else {
      const body = z
        .object({
          id_document_url: z.string().url('URL del documento de identidad inválida'),
          selfie_url: z.string().url('URL de la selfie inválida'),
          id_number: z.string().trim().min(5, 'Número de identificación demasiado corto'),
          full_name: z.string().trim().min(2, 'Nombre completo requerido'),
        })
        .safeParse(request.body);
      if (!body.success) {
        return reply.status(400).send({ error: 'Invalid body', details: body.error.flatten() });
      }
      idNumber = body.data.id_number;
      fullName = body.data.full_name;
      documentRef = body.data.id_document_url;
      selfieRef = body.data.selfie_url;
    }

    idNumber = idNumber.trim();
    fullName = fullName.trim();
    if (idNumber.length < 5 || fullName.length < 2) {
      return reply
        .status(400)
        .send({ error: 'Indica tu nombre completo y número de identificación.', code: 'invalid_identity_data' });
    }
    if ((!documentBuffer || !selfieBuffer) && (!documentRef || !selfieRef)) {
      return reply
        .status(400)
        .send({ error: 'Adjunta el documento de identidad y la selfie.', code: 'documents_required' });
    }

    const now = new Date();
    const verificationId = randomUUID();

    // Identity documents live in the private bucket (`MINIO_PRIVATE_BUCKET`), never the media one.
    if (documentBuffer && selfieBuffer) {
      const base = `verifications/${userId}/${verificationId}`;
      [documentRef, selfieRef] = await Promise.all([
        uploadPrivateBuffer(`${base}-document`, documentBuffer, 'application/octet-stream'),
        uploadPrivateBuffer(`${base}-selfie`, selfieBuffer, 'application/octet-stream'),
      ]);
    }

    const moderation: IdentityModerationResult =
      documentBuffer && selfieBuffer
        ? await moderateIdentityBuffers(documentBuffer, selfieBuffer, { idNumber, fullName })
        : {
            verdict: 'review',
            score: 0,
            labels: [],
            reason: 'document_urls_require_manual_review',
            provider: 'rules',
            documentsMatch: false,
          };

    const approved = moderation.verdict === 'approved';
    const rejected = moderation.verdict === 'rejected';
    const status = approved ? 'verified' : rejected ? 'rejected' : 'pending';
    const reviewBy = approved || rejected ? null : reviewDeadline(now);

    await prisma.user.update({
      where: { id: userId },
      data: {
        verificationId,
        verificationStatus: status,
        verificationDocUrl: documentRef,
        verificationSelfieUrl: selfieRef,
        verificationIdNumber: idNumber,
        verificationSubmittedAt: now,
        verificationReviewedAt: approved || rejected ? now : null,
        verificationVerdict: moderation.verdict,
        verificationScore: moderation.score,
        verificationReason: moderation.reason,
        idVerified: approved,
        idVerifiedAt: approved ? now : null,
      },
    });

    if (approved) {
      const verifiedUser = await prisma.user.findUnique({ where: { id: userId }, select: { email: true } });
      void sendPushToUser(userId, 'host_bookings', {
        title: 'Identidad verificada / Identity verified',
        body: 'Tu insignia azul ya está activa. / Your blue badge is now active.',
        data: { type: 'verification_approved' },
      });
      if (verifiedUser?.email) {
        void deliverEmail({
          to: verifiedUser.email,
          subject: 'Identidad verificada / Identity verified',
          html: `
            <h2>Tu identidad ha sido verificada / Your identity has been verified</h2>
            <p>Tu insignia azul ya está activa y puedes publicar propiedades en Elevari.</p>
            <p>Your blue verified badge is active and you can publish properties on Elevari.</p>
          `,
        });
      }
    }

    return {
      verification_id: verificationId,
      status,
      verdict: moderation.verdict,
      id_verified: approved,
      sla_minutes: approved || rejected ? 0 : 60,
      review_by: reviewBy?.toISOString() ?? null,
      message: approved
        ? '¡Verificado! Tu insignia azul ya está activa.'
        : rejected
          ? 'No pudimos validar el documento. Revisa tu nombre y número de identificación, y vuelve a intentarlo.'
          : 'Verificación recibida. La revisamos en máximo 1 hora y te avisamos por correo y notificación.',
    };
  });

  /**
   * Host checks their identity verification status.
   *
   * Never returns the document keys or the ID number: only the state, the machine verdict and the
   * deadline the host was promised.
   */
  app.get('/auth/verification-status', {
    preHandler: [authenticate, requireRoles(['host'])],
  }, async (request, reply) => {
    const user = await prisma.user.findUnique({
      where: { id: request.auth!.sub },
      select: {
        idVerified: true,
        idVerifiedAt: true,
        verificationId: true,
        verificationStatus: true,
        verificationSubmittedAt: true,
        verificationReviewedAt: true,
        verificationVerdict: true,
        verificationReason: true,
      },
    });
    if (!user) {
      return reply.status(404).send({ error: 'User not found' });
    }

    const pending = user.verificationStatus === 'pending';
    return {
      id_verified: user.idVerified,
      id_verified_at: user.idVerifiedAt?.toISOString() ?? null,
      verification_id: user.verificationId,
      verification_status: user.verificationStatus,
      verdict: user.verificationVerdict,
      submitted_at: user.verificationSubmittedAt?.toISOString() ?? null,
      reviewed_at: user.verificationReviewedAt?.toISOString() ?? null,
      sla_minutes: pending ? 60 : 0,
      review_by: pending && user.verificationSubmittedAt
        ? new Date(user.verificationSubmittedAt.getTime() + 60 * 60 * 1000).toISOString()
        : null,
    };
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

    // Same answer for everyone: this only depends on the server setup, never on the address.
    if (!isEmailDeliveryAvailable()) {
      request.log.error('Password reset requested but e-mail delivery is not configured');
      return reply.status(503).send({
        error:
          'El envío de correos no está disponible en este momento. Inténtalo de nuevo en unos minutos o escríbenos por WhatsApp.',
        code: 'email_unavailable',
      });
    }

    const user = await findUserByEmail(body.data.email);

    // Respuesta genérica (no revelar si el email existe)
    const okResponse = {
      success: true,
      message: 'Si el correo está registrado, recibirás un enlace en unos minutos.',
    };

    // The e-mail is sent after answering: awaiting the provider would make existing accounts
    // slower (or fail with a 503) than unknown ones, which is an enumeration oracle.
    if (user?.passwordHash && !user.deletedAt && !resetEmailRequests.peek(user.id).blocked) {
      resetEmailRequests.hit(user.id);
      const { id, email: address, name, passwordHash } = user;
      notify(
        request,
        'Password reset',
        (async () => {
          const token = await signResetToken(id, address, passwordHash);
          return sendPasswordResetEmail({
            email: address,
            name: name ?? '',
            // In the fragment: it never reaches access logs, CDN logs or analytics.
            resetUrl: `${publicSiteUrl()}/auth/reset-password#token=${encodeURIComponent(token)}`,
          });
        })(),
      );
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

    // Opening the reset link proves control of the mailbox, so it also lifts a failed-login lock.
    loginFailures.reset(normalizeEmail(user.email));

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
