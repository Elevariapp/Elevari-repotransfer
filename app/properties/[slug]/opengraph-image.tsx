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
          background: 'linear-gradient(135deg, #1E4835 0%, #2F6B4F 55%, #0F2A20 100%)',
          color: '#F7F4EC',
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
            background: 'linear-gradient(90deg, rgba(15,42,32,0.94) 0%, rgba(15,42,32,0.55) 100%)',
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
            <div
              style={{
                width: 52,
                height: 52,
                borderRadius: 16,
                background: '#0F2A20',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '2px solid #5FA76A',
                fontSize: 26,
                color: '#5FA76A',
              }}
            >
              ◠
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: 34, fontWeight: 700, letterSpacing: -1 }}>eleveri</span>
              <span style={{ fontSize: 15, letterSpacing: 4, color: '#F6E3B8' }}>ESCAPES NATURALES</span>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ width: 88, height: 6, background: '#E9A820', borderRadius: 3, marginBottom: 26 }} />
            <span style={{ fontSize: 62, fontWeight: 700, lineHeight: 1.08, letterSpacing: -1.5, maxWidth: 900 }}>
              {title.length > 72 ? `${title.slice(0, 71)}…` : title}
            </span>
            <span style={{ marginTop: 20, fontSize: 28, color: '#DCE7E1' }}>{location}</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 26, color: '#F6E3B8' }}>
              {price ? `Desde ${price} / noche` : 'Precio total antes de pagar'}
            </span>
            <span
              style={{
                fontSize: 22,
                padding: '10px 22px',
                borderRadius: 999,
                border: '1px solid rgba(246,227,184,0.45)',
                color: '#F7F4EC',
              }}
            >
              eleveri.app
            </span>
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
