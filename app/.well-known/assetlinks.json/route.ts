import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// Android App Links (Digital Asset Links). Comma-separated SHA-256 cert fingerprints:
// Play App Signing key + upload key (+ any extra signing cert used for APK distribution).
export function GET() {
  const fingerprints = (process.env.ANDROID_SHA256_CERT_FINGERPRINTS ?? '')
    .split(',')
    .map((f) => f.trim().toUpperCase())
    .filter((f) => /^([0-9A-F]{2}:){31}[0-9A-F]{2}$/.test(f));

  if (fingerprints.length === 0) {
    return new NextResponse('Not found', { status: 404 });
  }

  return NextResponse.json(
    [
      {
        relation: ['delegate_permission/common.handle_all_urls'],
        target: {
          namespace: 'android_app',
          package_name: process.env.ANDROID_PACKAGE_NAME ?? 'elevari.androidapp',
          sha256_cert_fingerprints: fingerprints,
        },
      },
    ],
    { headers: { 'Cache-Control': 'public, max-age=3600' } },
  );
}
