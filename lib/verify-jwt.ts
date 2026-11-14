import { jwtVerify } from 'jose';

const JWT_ISSUER = 'elevari-api';
const JWT_AUDIENCE = 'elevari-web';

export type WebJwtPayload = {
  sub: string;
  email: string;
  role: 'guest' | 'host' | 'admin';
};

function getSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET ?? 'wana_dev_jwt_secret_change_in_production';
  return new TextEncoder().encode(secret);
}

export async function verifyWebJwt(token: string): Promise<WebJwtPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret(), {
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
