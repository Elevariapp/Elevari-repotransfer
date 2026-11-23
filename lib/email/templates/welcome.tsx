import { siteUrl } from '@/lib/site-url';

export interface WelcomeData {
  userName: string;
  loginUrl: string;
}

export function WelcomeEmail({ data }: { data: WelcomeData }) {
  const { userName, loginUrl } = data;

  return `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>Bienvenido a Elevari</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Plus+Jakarta+Sans:wght@500;600;700&display=swap');
        body { font-family: 'Inter', sans-serif; margin: 0; padding: 0; background: #FEF3C7; color: #0F172A; }
        .container { max-width: 600px; margin: 0 auto; padding: 40px 20px; }
        .card { background: #FFFFFF; border-radius: 1.25rem; overflow: hidden; box-shadow: 0 12px 32px rgba(22, 34, 44, 0.1); }
        .header { background: #C2410C; color: #FFFFFF; padding: 32px 24px; text-align: center; }
        .header h1 { margin: 0; font-size: 1.5rem; font-weight: 700; font-family: 'Plus Jakarta Sans', sans-serif; }
        .body { padding: 32px 24px; }
        .body h2 { font-family: 'Plus Jakarta Sans', sans-serif; font-size: 1.25rem; color: #0F172A; margin-top: 0; }
        .cta { text-align: center; margin: 24px 0; }
        .cta-button { display: inline-block; background: #C2410C; color: #FFFFFF; padding: 14px 32px; border-radius: 0.875rem; text-decoration: none; font-weight: 600; font-family: 'Plus Jakarta Sans', sans-serif; }
        .footer { padding: 24px; background: #0F172A; color: #FEF3C7; font-size: 0.8125rem; text-align: center; border-top: 1px solid #E2E8F0; }
        .footer a { color: #F59E0B; text-decoration: none; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="card">
          <div class="header">
            <img src="${siteUrl('/logo.png')}" alt="Elevari" width="48" height="48" style="display: block; margin: 0 auto 12px;" />
            <h1>¡Bienvenido a Elevari! 🏕️</h1>
          </div>
          <div class="body">
            <p>Hola <strong>${userName}</strong>,</p>
            <p>Gracias por unirte a Elevari, la plataforma curada de glamping en Colombia. Descubre experiencias únicas de naturaleza, confort y aventura en Sutatausa, Cucunubá y la Sabana de Bogotá.</p>
            
            <div class="cta">
              <a href="${loginUrl}" class="cta-button">Explorar propiedades</a>
            </div>
          </div>
          <div class="footer">
            <p>¿Preguntas? Contáctanos en <a href="mailto:reserve@elevari.live">reserve@elevari.live</a></p>
            <p>© ${new Date().getFullYear()} Elevari. Todos los derechos reservados.</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
}