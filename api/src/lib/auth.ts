import { createHash, createHmac, timingSafeEqual } from 'node:crypto';
import bcrypt from 'bcryptjs';
import { SignJWT, jwtVerify } from 'jose';
import type { UserRole } from '@prisma/client';

const JWT_ISSUER = 'wana-api';
const JWT_AUDIENCE = 'wana-web';
const JWT_RESET_AUDIENCE = 'wana-reset';
const EXPIRY = '7d';
const RESET_EXPIRY = '1h';

export interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
  /** Bumped when the password changes; see `users.token_version`. */
  tokenVersion?: number;
}

export interface JwtPayload {
  sub: string;
  email: string;
  role: UserRole;
  /** Session version the token was issued for (tokens from before this existed count as 0). */
  tv: number;
}

function getSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET no está definido. Define JWT_SECRET (mínimo 32 caracteres) antes de iniciar la API.');
  }
  return new TextEncoder().encode(secret);
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

let dummyHash: Promise<string> | null = null;

/**
 * Burns the same bcrypt time as a real check so response time doesn't reveal whether an
 * email is registered (or has a password at all).
 */
export async function verifyPasswordAgainstDummy(password: string): Promise<void> {
  dummyHash ??= hashPassword('elevari-timing-equalizer');
  await bcrypt.compare(password, await dummyHash);
}

/** Constant-time string comparison (hashes first so length differences don't leak). */
export function safeEqual(a: string, b: string): boolean {
  const left = createHash('sha256').update(a).digest();
  const right = createHash('sha256').update(b).digest();
  return timingSafeEqual(left, right);
}

export async function signToken(user: AuthUser): Promise<string> {
  return new SignJWT({ email: user.email, role: user.role, tv: user.tokenVersion ?? 0 })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(user.id)
    .setIssuer(JWT_ISSUER)
    .setAudience(JWT_AUDIENCE)
    .setIssuedAt()
    .setExpirationTime(EXPIRY)
    .sign(getSecret());
}

/**
 * Binds a reset token to the password it was issued for: once the password changes (by the
 * reset itself or any other way) the fingerprint no longer matches and the link stops working.
 */
export function passwordFingerprint(passwordHash: string | null): string {
  return createHmac('sha256', getSecret()).update(passwordHash ?? '').digest('hex').slice(0, 24);
}

export async function signResetToken(
  userId: string,
  email: string,
  passwordHash: string | null,
): Promise<string> {
  return new SignJWT({ email, purpose: 'password_reset', pwd: passwordFingerprint(passwordHash) })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(userId)
    .setIssuer(JWT_ISSUER)
    .setAudience(JWT_RESET_AUDIENCE)
    .setIssuedAt()
    .setExpirationTime(RESET_EXPIRY)
    .sign(getSecret());
}

export async function verifyResetToken(
  token: string,
): Promise<{ sub: string; email: string; pwd: string } | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret(), {
      issuer: JWT_ISSUER,
      audience: JWT_RESET_AUDIENCE,
    });
    if (!payload.sub || payload.purpose !== 'password_reset' || typeof payload.pwd !== 'string') return null;
    return { sub: payload.sub, email: String(payload.email ?? ''), pwd: payload.pwd };
  } catch {
    return null;
  }
}

export async function verifyToken(token: string): Promise<JwtPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret(), {
      issuer: JWT_ISSUER,
      audience: JWT_AUDIENCE,
    });
    if (!payload.sub || !payload.email || !payload.role) return null;
    return {
      sub: payload.sub,
      email: String(payload.email),
      role: payload.role as UserRole,
      tv: typeof payload.tv === 'number' ? payload.tv : 0,
    };
  } catch {
    return null;
  }
}

export function serializeUser(user: {
  id: string;
  email: string;
  name: string | null;
  phone?: string | null;
  role: UserRole;
  passwordHash?: string | null;
}) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    phone: user.phone ?? null,
    role: user.role,
    // Lets clients ask for the right confirmation (password vs. typing the e-mail) before deleting.
    has_password: Boolean(user.passwordHash),
  };
}
