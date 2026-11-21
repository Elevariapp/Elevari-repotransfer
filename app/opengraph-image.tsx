import { ImageResponse } from 'next/og';

export const alt = 'Elevari — Glamping en Colombia';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: 96,
          background: 'linear-gradient(135deg, #1E4835 0%, #2F6B4F 60%, #3D8163 100%)',
          color: '#ffffff',
        }}
      >
        <div style={{ fontSize: 120, fontWeight: 700, letterSpacing: -4 }}>Elevari</div>
        <div style={{ marginTop: 24, fontSize: 44, opacity: 0.92 }}>
          Glamping y escapes naturales en Colombia
        </div>
        <div style={{ marginTop: 56, fontSize: 30, opacity: 0.75 }}>elevari.live</div>
      </div>
    ),
    size,
  );
}
