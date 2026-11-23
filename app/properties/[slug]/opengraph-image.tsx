import { ImageResponse } from 'next/og';
import { wanaApi } from '@/lib/api-client';
import { formatCopLabel, propertyLocation } from '@/lib/share-metadata';

export const alt = 'Elevari — escape natural en Colombia';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';

function absoluteImage(src: string | null | undefined): string | null {
  if (!src) return null;
  if (/^https?:\/\//i.test(src)) return src;
  return `${SITE_URL.replace(/\/$/, '')}${src.startsWith('/') ? '' : '/'}${src}`;
}

export default async function OpengraphImage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  let title = 'Escapes naturales en Colombia';
  let location = 'Sutatausa · Cucunubá · Sabana de Bogotá';
  let price: string | null = null;
  let cover: string | null = null;

  try {
    const property = await wanaApi.getProperty(slug);
    title = property.title;
    location = propertyLocation({
      slug,
      title: property.title,
      city: property.city,
      country: property.country,
    });
    price = formatCopLabel(property.price_per_night);
    cover = absoluteImage(property.cover_image);
  } catch {
    // API unavailable: render the brand card so the link is still shareable.
  }

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          position: 'relative',
          background: 'linear-gradient(135deg, #9A340E 0%, #C2410C 55%, #431407 100%)',
          color: '#FEF3C7',
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        {cover ? (
          <img
            src={cover}
            alt=""
            width={1200}
            height={630}
            style={{ position: 'absolute', inset: 0, objectFit: 'cover', opacity: 0.42 }}
          />
        ) : null}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(90deg, rgba(42,14,5,0.94) 0%, rgba(42,14,5,0.55) 100%)',
          }}
        />
        <div
          style={{
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            padding: '64px 72px',
            width: '100%',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <svg width="58" height="58" viewBox="133 113 270 270" fill="none">
              <path
                d="M168 344C168 232 212 152 256 152C300 152 344 232 344 344"
                stroke="#EA9A2E"
                strokeWidth="30"
                strokeLinecap="round"
              />
              <path d="M190 272H322" stroke="#EA9A2E" strokeWidth="30" strokeLinecap="round" />
              <path d="M200 208H312" stroke="#FEF3C7" strokeWidth="26" strokeLinecap="round" opacity="0.9" />
              <circle cx="364" cy="168" r="34" fill="#F59E0B" opacity="0.3" />
              <circle cx="364" cy="168" r="20" fill="#F59E0B" />
            </svg>
            <span style={{ fontSize: 38, fontWeight: 700, letterSpacing: -1 }}>Elevari</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ width: 88, height: 6, background: '#EA9A2E', borderRadius: 3, marginBottom: 26 }} />
            <span style={{ fontSize: 62, fontWeight: 700, lineHeight: 1.08, letterSpacing: -1.5, maxWidth: 900 }}>
              {title.length > 72 ? `${title.slice(0, 71)}…` : title}
            </span>
            <span style={{ marginTop: 20, fontSize: 28, color: '#FED7AA' }}>{location}</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 26, color: '#FEF3C7' }}>
              {price ? `Desde ${price} / noche` : 'Precio total antes de pagar'}
            </span>
            <span
              style={{
                fontSize: 22,
                padding: '10px 22px',
                borderRadius: 999,
                border: '1px solid rgba(254,243,199,0.45)',
                color: '#FEF3C7',
              }}
            >
              elevari.live
            </span>
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
