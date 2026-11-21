import { siteUrl } from '@/lib/site-url';

export interface BookingConfirmationData {
  guestName: string;
  propertyName: string;
  checkIn: string;
  checkOut: string;
  total: string;
  bookingReference: string;
  hostName: string;
  hostPhone?: string;
}

export function BookingConfirmationEmail({ data }: { data: BookingConfirmationData }) {
  const { guestName, propertyName, checkIn, checkOut, total, bookingReference, hostName, hostPhone } = data;

  return `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>Confirmación de reserva - Elevari</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Plus+Jakarta+Sans:wght@500;600;700&display=swap');
        body { font-family: 'Inter', sans-serif; margin: 0; padding: 0; background: #F7F4EC; color: #22313F; }
        .container { max-width: 600px; margin: 0 auto; padding: 40px 20px; }
        .card { background: #FFFFFF; border-radius: 1.25rem; overflow: hidden; box-shadow: 0 12px 32px rgba(22, 34, 44, 0.1); }
        .header { background: #2F6B4F; color: #FFFFFF; padding: 32px 24px; text-align: center; }
        .header h1 { margin: 0; font-size: 1.5rem; font-weight: 700; font-family: 'Plus Jakarta Sans', sans-serif; }
        .body { padding: 32px 24px; }
        .body h2 { font-family: 'Plus Jakarta Sans', sans-serif; font-size: 1.25rem; color: #22313F; margin-top: 0; }
        .detail { display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #E2DCCC; }
        .detail-label { color: #5C6B65; font-size: 0.875rem; }
        .detail-value { font-weight: 500; color: #22313F; }
        .cta { text-align: center; margin: 24px 0; }
        .cta-button { display: inline-block; background: #E9A820; color: #7A4A00; padding: 14px 32px; border-radius: 0.875rem; text-decoration: none; font-weight: 600; font-family: 'Plus Jakarta Sans', sans-serif; }
        .footer { padding: 24px; background: #F7F4EC; color: #5C6B65; font-size: 0.8125rem; text-align: center; border-top: 1px solid #E2DCCC; }
        .footer a { color: #2F6B4F; text-decoration: none; }
        .badge { display: inline-block; background: #DFF0E3; color: #1E4835; padding: 6px 12px; border-radius: 9999px; font-size: 0.75rem; font-weight: 600; margin-bottom: 16px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="card">
          <div class="header">
            <h1>¡Reserva confirmada! 🏕️</h1>
          </div>
          <div class="body">
            <p>Hola <strong>${guestName}</strong>,</p>
            <p>Tu reserva en <strong>${propertyName}</strong> ha sido confirmada. Aquí tienes los detalles:</p>
            
            <div class="detail">
              <span class="detail-label">Referencia</span>
              <span class="detail-value">#${bookingReference}</span>
            </div>
            <div class="detail">
              <span class="detail-label">Check-in</span>
              <span class="detail-value">${checkIn}</span>
            </div>
            <div class="detail">
              <span class="detail-label">Check-out</span>
              <span class="detail-value">${checkOut}</span>
            </div>
            <div class="detail">
              <span class="detail-label">Total</span>
              <span class="detail-value">${total}</span>
            </div>
            <div class="detail">
              <span class="detail-label">Anfitrión</span>
              <span class="detail-value">${hostName}${hostPhone ? ` · ${hostPhone}` : ''}</span>
            </div>

            <div class="cta">
              <a href="${siteUrl('/my-bookings')}" class="cta-button">Ver mis reservas</a>
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