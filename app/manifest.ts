import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: '/',
    name: 'Elevari — Glamping en Colombia',
    short_name: 'Elevari',
    description: 'Reserva experiencias de glamping únicas en Colombia.',
    lang: 'es-CO',
    start_url: '/?source=pwa',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#fef3c7',
    theme_color: '#9a340e',
    categories: ['travel', 'lifestyle'],
    icons: [
      { src: '/brand/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/brand/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/brand/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
      { src: '/app/apple-icon.png', sizes: '180x180', type: 'image/png', purpose: 'any' },
    ],
    screenshots: [
      {
        src: '/brand/icons/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        form_factor: 'narrow',
        label: 'Elevari — Reserva tu glamping en Colombia',
      },
    ],
    shortcuts: [
      { name: 'Explorar espacios', url: '/properties' },
      { name: 'Mi cuenta', url: '/account' },
    ],
  };
}
