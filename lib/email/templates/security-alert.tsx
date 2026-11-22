export interface SecurityAlertData {
  userName: string;
  eventType: string;
  ipAddress: string;
  location: string;
  timestamp: string;
  actionUrl: string;
}

export function SecurityAlertEmail({ data }: { data: SecurityAlertData }) {
  const { userName, eventType, ipAddress, location, timestamp, actionUrl } = data;

  return `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>Alerta de seguridad - Elevari</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Plus+Jakarta+Sans:wght@500;600;700&display=swap');
        body { font-family: 'Inter', sans-serif; margin: 0; padding: 0; background: #FEF3C7; color: #0F172A; }
        .container { max-width: 600px; margin: 0 auto; padding: 40px 20px; }
        .card { background: #FFFFFF; border-radius: 1.25rem; overflow: hidden; box-shadow: 0 12px 32px rgba(22, 34, 44, 0.1); }
        .header { background: #B3261E; color: #FFFFFF; padding: 32px 24px; text-align: center; }
        .header h1 { margin: 0; font-size: 1.5rem; font-weight: 700; font-family: 'Plus Jakarta Sans', sans-serif; }
        .body { padding: 32px 24px; }
        .body h2 { font-family: 'Plus Jakarta Sans', sans-serif; font-size: 1.25rem; color: #0F172A; margin-top: 0; }
        .detail { display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #E2E8F0; }
        .detail-label { color: #64748B; font-size: 0.875rem; }
        .detail-value { font-weight: 500; color: #0F172A; }
        .cta { text-align: center; margin: 24px 0; }
        .cta-button { display: inline-block; background: #D97706; color: #FFFFFF; padding: 14px 32px; border-radius: 0.875rem; text-decoration: none; font-weight: 600; font-family: 'Plus Jakarta Sans', sans-serif; }
        .footer { padding: 24px; background: #0F172A; color: #FEF3C7; font-size: 0.8125rem; text-align: center; border-top: 1px solid #E2E8F0; }
        .footer a { color: #D97706; text-decoration: none; }
        .badge { display: inline-block; background: #FDECEB; color: #B3261E; padding: 6px 12px; border-radius: 9999px; font-size: 0.75rem; font-weight: 600; margin-bottom: 16px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="card">
          <div class="header">
            <h1>Alerta de seguridad 🔒</h1>
          </div>
          <div class="body">
            <p>Hola <strong>${userName}</strong>,</p>
            <p>Se ha detectado una actividad en tu cuenta de Elevari:</p>
            
            <div class="detail">
              <span class="detail-label">Evento</span>
              <span class="detail-value">${eventType}</span>
            </div>
            <div class="detail">
              <span class="detail-label">Dirección IP</span>
              <span class="detail-value">${ipAddress}</span>
            </div>
            <div class="detail">
              <span class="detail-label">Ubicación</span>
              <span class="detail-value">${location}</span>
            </div>
            <div class="detail">
              <span class="detail-label">Fecha y hora</span>
              <span class="detail-value">${timestamp}</span>
            </div>

            <p>Si no fuiste tú, te recomendamos cambiar tu contraseña inmediatamente y revisar la actividad de tu cuenta.</p>

            <div class="cta">
              <a href="${actionUrl}" class="cta-button">Revisar actividad</a>
            </div>
          </div>
          <div class="footer">
            <p>¿Preguntas? Contáctanos en <a href="mailto:soporte@elevari.live">soporte@elevari.live</a></p>
            <p>© ${new Date().getFullYear()} Elevari. Todos los derechos reservados.</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
}