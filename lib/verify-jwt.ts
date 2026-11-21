import { jwtVerify } from 'jose';

const JWT_ISSUER = 'elevari-api';
const JWT_AUDIENCE = 'elevari-web';

export type WebJwtPayload = {
  sub: string;
  email: string;
  role: 'guest' | 'host' | 'admin';
};

const DEV_FALLBACK_SECRET = 'elevari_dev_jwt_secret_change_in_production';

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

export async function verifyWebJwt(token: string): Promise<WebJwtPayload | null> {
  // Resolved outside the try/catch: a missing secret must fail loudly, not look like an invalid token.
  const key = getSecret();
  try {
    const { payload } = await jwtVerify(token, key, {
      issuer: JWT_ISSUER,
      audience: JWT_AUDIENCE,
    });
    if (!payload.sub || !payload.email || !payload.role) return null;
    const role = String(payload.role);
    if (role !== 'guest' && role !== 'host' && role !== 'admin') return null;
    return {
      sub: payload.sub,
      email: String(payload.email),
      role,
    };
  } catch {
    return null;
  }
}
