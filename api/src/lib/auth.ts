import bcrypt from 'bcryptjs';
import { SignJWT, jwtVerify } from 'jose';
import type { UserRole } from '@prisma/client';

const JWT_ISSUER = 'elevari-api';
const JWT_AUDIENCE = 'elevari-web';
const JWT_RESET_AUDIENCE = 'elevari-reset';
const EXPIRY = '7d';
const RESET_EXPIRY = '1h';

export interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
}

export interface JwtPayload {
  sub: string;
  email: string;
  role: UserRole;
}

const DEV_FALLBACK_SECRET = 'elevari_dev_jwt_secret_change_in_production';

/** In production a strong JWT_SECRET is mandatory; the dev fallback is never used there. */
function getSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (process.env.NODE_ENV === 'production') {
    if (!secret || secret.length < 32 || secret === DEV_FALLBACK_SECRET) {
      throw new Error('JWT_SECRET must be set to a strong value (>= 32 chars) in production');
    }
    return new TextEncoder().encode(secret);
  }
  return new TextEncoder().encode(secret ?? DEV_FALLBACK_SECRET);
}

/** Fail fast at startup instead of on the first login. */
export function assertJwtSecret(): void {
  getSecret();
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function signToken(user: AuthUser): Promise<string> {
  return new SignJWT({ email: user.email, role: user.role })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(user.id)
    .setIssuer(JWT_ISSUER)
    .setAudience(JWT_AUDIENCE)
    .setIssuedAt()
    .setExpirationTime(EXPIRY)
    .sign(getSecret());
}

export async function signResetToken(userId: string, email: string): Promise<string> {
  return new SignJWT({ email, purpose: 'password_reset' })
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
): Promise<{ sub: string; email: string } | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret(), {
      issuer: JWT_ISSUER,
      audience: JWT_RESET_AUDIENCE,
    });
    if (!payload.sub || payload.purpose !== 'password_reset') return null;
    return { sub: payload.sub, email: String(payload.email ?? '') };
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
    };
  } catch {
    return null;
  }
}

export function serializeUser(user: {
  id: string;
  email: string;
  name: string | null;
  role: UserRole;
}) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
  };
}
