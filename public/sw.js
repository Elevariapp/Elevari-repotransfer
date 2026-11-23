/*
 * Minimal service worker. It makes Elevari installable and shows a friendly page when the device is
 * offline. It deliberately caches nothing, so nobody ever sees stale prices, availability or sessions.
 */
const OFFLINE_PAGE = `<!doctype html>
<html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Sin conexión | Elevari</title>
<style>
  body{margin:0;min-height:100vh;display:grid;place-items:center;padding:24px;box-sizing:border-box;background:#fef3c7;color:#1f2937;font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;text-align:center}
  main{max-width:22rem}
  h1{margin:0 0 .5rem;font-size:1.5rem}
  p{margin:0 0 1.5rem;line-height:1.5;color:#4b5563}
  a{display:inline-block;min-height:48px;box-sizing:border-box;padding:.8rem 1.5rem;border-radius:9999px;background:#c2410c;color:#fff;font-weight:600;text-decoration:none}
</style></head>
<body><main>
  <h1>Sin conexión</h1>
  <p>No pudimos conectarnos a Elevari. Revisa tu conexión a internet e inténtalo de nuevo.</p>
  <a href="/">Reintentar</a>
</main></body></html>`;

self.addEventListener('install', () => self.skipWaiting());

self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));

self.addEventListener('fetch', (event) => {
  if (event.request.mode !== 'navigate') return;
  event.respondWith(
    fetch(event.request).catch(
      () =>
        new Response(OFFLINE_PAGE, {
          status: 503,
          headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' },
        }),
    ),
  );
});
