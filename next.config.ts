import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'standalone',
  compress: true,
  poweredByHeader: false,
  typescript: {
    ignoreBuildErrors: process.env.NEXT_IGNORE_TYPE_ERRORS === '1',
  },
    images: {
      formats: ['image/webp'],
      deviceSizes: [640, 750, 828, 1080, 1200, 1920],
      imageSizes: [256, 384, 640],
      qualities: [60, 72, 75],
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
