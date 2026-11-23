import { jwtVerify } from 'jose';

// The API signs session tokens with the wana-* claims (api/src/lib/auth.ts). The elevari-* pair is
// accepted as well so renaming the claims on one side can never lock every user out of the
// protected routes again.
const JWT_ISSUERS = ['wana-api', 'elevari-api'];
const JWT_AUDIENCES = ['wana-web', 'elevari-web'];

export type WebJwtPayload = {
  sub: string;
  email: string;
  role: 'guest' | 'host' | 'admin';
};

function getSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET no está definido. Define JWT_SECRET (mínimo 32 caracteres) antes de iniciar la web.');
  }
  return new TextEncoder().encode(secret);
}

export async function verifyWebJwt(token: string): Promise<WebJwtPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret(), {
      issuer: JWT_ISSUERS,
      audience: JWT_AUDIENCES,
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
