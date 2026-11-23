import { resend, EMAIL_FROM } from './client';
import { BookingConfirmationEmail } from './templates/booking-confirmation';
import { SecurityAlertEmail } from './templates/security-alert';
import { WelcomeEmail } from './templates/welcome';

import type { BookingConfirmationData } from './templates/booking-confirmation';
import type { SecurityAlertData } from './templates/security-alert';
import type { WelcomeData } from './templates/welcome';

export type EmailType = 'booking-confirmation' | 'security-alert' | 'welcome';

export type SendEmailParams =
  | { to: string; type: 'booking-confirmation'; data: BookingConfirmationData }
  | { to: string; type: 'security-alert'; data: SecurityAlertData }
  | { to: string; type: 'welcome'; data: WelcomeData };

const subjects: Record<EmailType, string> = {
  'booking-confirmation': 'Confirmación de reserva - Elevari',
  'security-alert': 'Alerta de seguridad - Elevari',
  'welcome': 'Bienvenido a Elevari',
};

function renderEmail(params: SendEmailParams): string | undefined {
  switch (params.type) {
    case 'booking-confirmation':
      return BookingConfirmationEmail({ data: params.data });
    case 'security-alert':
      return SecurityAlertEmail({ data: params.data });
    case 'welcome':
      return WelcomeEmail({ data: params.data });
    default:
      return undefined;
  }
}

export async function sendEmail(params: SendEmailParams) {
  const { to, type } = params;
  if (!process.env.RESEND_API_KEY) {
    console.warn('[Email] RESEND_API_KEY not configured, skipping email send');
    return { success: false, error: 'RESEND_API_KEY not configured' };
  }

  const html = renderEmail(params);
  if (html === undefined) {
    return { success: false, error: `Unknown email type: ${type}` };
  }

  try {
    const result = await resend.emails.send({
      from: EMAIL_FROM,
      to,
      subject: subjects[type],
      html,
    });
    return { success: true, data: result };
  } catch (error) {
    console.error('[Email] Send failed:', error);
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
}

export async function sendBookingConfirmation(to: string, data: BookingConfirmationData) {
  return sendEmail({ to, type: 'booking-confirmation', data });
}

export async function sendSecurityAlert(to: string, data: SecurityAlertData) {
  return sendEmail({ to, type: 'security-alert', data });
}

export async function sendWelcomeEmail(to: string, data: WelcomeData) {
  return sendEmail({ to, type: 'welcome', data });
}