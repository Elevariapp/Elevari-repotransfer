import type { NextConfig } from 'next';

/**
 * Content Security Policy — allowlist built from the official integrations:
 *  - Next.js (inline bootstrap) and Tailwind (inline styles)
 *  - Cloudflare Turnstile (script + iframe)
 *  - Google Identity Services (script + iframe)
 *  - GA4 / GTM and Meta Pixel (script + connect + img)
 *  - Wompi hosted checkout (top-level navigation via form-action)
 *  - S3-compatible media over HTTPS (img-src https:)
 *
 * CSP_ENFORCE=0 disables blocking (report-only) for local debugging.
 * Default is enforce: the policy was validated in report-only mode with 0
 * violations across all routes before being promoted.
 */
const CSP_ENFORCE = process.env.CSP_ENFORCE !== '0';

const cspDirectives = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'none'",
  "form-action 'self' https://checkout.wompi.co https://sandbox.wompi.co",
  [
    "script-src 'self' 'unsafe-inline'",
    'https://www.googletagmanager.com',
    'https://www.google-analytics.com',
    'https://connect.facebook.net',
    'https://challenges.cloudflare.com',
    'https://accounts.google.com',
    'https://www.google.com',
  ].join(' '),
  "style-src 'self' 'unsafe-inline' https://accounts.google.com https://www.gstatic.com",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data: https://fonts.gstatic.com https://www.gstatic.com",
  [
    "connect-src 'self'",
    'https://www.google-analytics.com',
    'https://analytics.google.com',
    'https://region1.google-analytics.com',
    'https://www.googletagmanager.com',
    'https://connect.facebook.net',
    'https://graph.facebook.com',
    'https://challenges.cloudflare.com',
    'https://accounts.google.com',
    'https://www.google.com',
  ].join(' '),
  "frame-src 'self' https://challenges.cloudflare.com https://accounts.google.com https://td.doubleclick.net",
  "worker-src 'self' blob:",
  "manifest-src 'self'",
  'upgrade-insecure-requests',
].join('; ');

const nextConfig: NextConfig = {
  output: 'standalone',
  compress: true,
  poweredByHeader: false,
  // Optional build concurrency cap (useful on memory-constrained CI runners).
  experimental: process.env.NEXT_BUILD_CPUS
    ? { cpus: Number(process.env.NEXT_BUILD_CPUS) }
    : undefined,
  async headers() {
    // Baseline OWASP headers applied to every response (defence in depth:
    // nginx adds its own set at the edge).
    const securityHeaders = [
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
      { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
      { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=(self)' },
      { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
      { key: 'Strict-Transport-Security', value: 'max-age=15552000; includeSubDomains' },
      {
        key: CSP_ENFORCE ? 'Content-Security-Policy' : 'Content-Security-Policy-Report-Only',
        value: cspDirectives,
      },
    ];
    return [{ source: '/:path*', headers: securityHeaders }];
  },
  typescript: {
    ignoreBuildErrors: process.env.NEXT_IGNORE_TYPE_ERRORS === '1',
  },
    images: {
      formats: ['image/webp'],
      deviceSizes: [640, 750, 828, 1080, 1200, 1920],
      imageSizes: [256, 384, 640],
      qualities: [50, 60, 72, 75],
      minimumCacheTTL: 86400,
    remotePatterns: [
      { protocol: 'http', hostname: 'localhost', port: '9000', pathname: '/wana-media/**' },
      { protocol: 'http', hostname: '164.92.241.30', pathname: '/wana-media/**' },
      // HTTPS is required for remote property media. Plaintext wildcard removed:
      // it allowed the image optimizer to fetch arbitrary http URLs (SSRF/resource abuse).
      { protocol: 'https', hostname: '**' },
    ],
  },
};

export default nextConfig;
