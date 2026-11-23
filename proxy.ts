import { NextRequest, NextResponse } from 'next/server';
import { verifyWebJwt } from '@/lib/verify-jwt';
import {
  LEGACY_SESSION_COOKIE,
  SESSION_COOKIE,
  readSessionCookie,
  sessionCookieDomain,
} from '@/lib/auth-cookie';

/**
 * Next.js 16 proxy (formerly middleware.ts).
 * Docs: https://nextjs.org/docs/app/api-reference/file-conventions/proxy
 */
const PROTECTED_PREFIXES = ['/host', '/account', '/admin'];
const ADMIN_PREFIX = '/admin';

// ResponseCookies is keyed by name, so it cannot expire the host-only and the Domain=.elevari.live
// variants of the same cookie in one response; append the headers directly.
function expireSessionCookies(res: NextResponse, hostname: string) {
  const domain = sessionCookieDomain(hostname);
  for (const name of [SESSION_COOKIE, LEGACY_SESSION_COOKIE]) {
    res.headers.append('set-cookie', `${name}=; Path=/; Max-Age=0`);
    if (domain) res.headers.append('set-cookie', `${name}=; Path=/; Max-Age=0; Domain=${domain}`);
  }
}

export default async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const needsAuth = PROTECTED_PREFIXES.some((p) => pathname.startsWith(p));
  if (!needsAuth) {
    return NextResponse.next();
  }

  const rawToken = readSessionCookie((name) => req.cookies.get(name));
  if (!rawToken) {
    const login = new URL('/auth/login', req.url);
    login.searchParams.set('redirect', pathname);
    return NextResponse.redirect(login);
  }

  let payload = await verifyWebJwt(rawToken);
  if (!payload && rawToken.includes('%')) {
    try {
      payload = await verifyWebJwt(decodeURIComponent(rawToken));
    } catch {
      payload = null;
    }
  }
  if (!payload) {
    const login = new URL('/auth/login', req.url);
    login.searchParams.set('redirect', pathname);
    const res = NextResponse.redirect(login);
    expireSessionCookies(res, req.nextUrl.hostname);
    return res;
  }

  if (pathname.startsWith(ADMIN_PREFIX) && payload.role !== 'admin') {
    return NextResponse.redirect(new URL('/account', req.url));
  }

  if (pathname.startsWith('/host') && payload.role !== 'host' && payload.role !== 'admin') {
    return NextResponse.redirect(new URL('/become-host', req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/host/:path*', '/account/:path*', '/admin/:path*'],
};
