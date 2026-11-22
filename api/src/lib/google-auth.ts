export interface GoogleProfile {
  email: string;
  name: string;
  emailVerified: boolean;
  googleId: string;
}

export async function verifyGoogleIdToken(idToken: string): Promise<GoogleProfile | null> {
  const clientId = process.env.GOOGLE_CLIENT_ID ?? process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  if (!clientId) return null;

  const res = await fetch(
    `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`,
  );

  if (!res.ok) return null;

  const data = (await res.json()) as {
    aud?: string;
    email?: string;
    email_verified?: string | boolean;
    name?: string;
    sub?: string;
  };

  if (data.aud !== clientId || !data.email || !data.sub) return null;

  const verified =
    data.email_verified === true || data.email_verified === 'true';

  return {
    email: data.email.toLowerCase(),
    name: data.name ?? data.email.split('@')[0],
    emailVerified: verified,
    googleId: data.sub,
  };
}

export function googleAuthConfigured(): boolean {
  return Boolean(process.env.GOOGLE_CLIENT_ID ?? process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID);
}
