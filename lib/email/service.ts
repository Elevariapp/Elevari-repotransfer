import { resend, EMAIL_FROM } from './client';
import { BookingConfirmationEmail } from './templates/booking-confirmation';
import { SecurityAlertEmail } from './templates/security-alert';
import { WelcomeEmail } from './templates/welcome';

export type EmailType = 'booking-confirmation' | 'security-alert' | 'welcome';

export interface SendEmailParams {
  to: string;
  type: EmailType;
  data: Record<string, unknown>;
}

const templateMap: Record<EmailType, { subject: string; component: typeof BookingConfirmationEmail }> = {
  'booking-confirmation': {
    subject: 'Confirmación de reserva - Elevari',
    component: BookingConfirmationEmail,
  },
  'security-alert': {
    subject: 'Alerta de seguridad - Elevari',
    component: SecurityAlertEmail,
  },
  'welcome': {
    subject: 'Bienvenido a Elevari',
    component: WelcomeEmail,
  },
};

export async function sendEmail({ to, type, data }: SendEmailParams) {
  if (!process.env.RESEND_API_KEY) {
    console.warn('[Email] RESEND_API_KEY not configured, skipping email send');
    return { success: false, error: 'RESEND_API_KEY not configured' };
  }

  const template = templateMap[type];
  if (!template) {
    return { success: false, error: `Unknown email type: ${type}` };
  }

  const html = template.component({ data: data as Parameters<typeof template.component>[0]['data'] });

  try {
    const result = await resend.emails.send({
      from: EMAIL_FROM,
      to,
      subject: template.subject,
      html,
    });
    return { success: true, data: result };
  } catch (error) {
    console.error('[Email] Send failed:', error);
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
}

export async function sendBookingConfirmation(to: string, data: Parameters<typeof BookingConfirmationEmail>[0]['data']) {
  return sendEmail({ to, type: 'booking-confirmation', data });
}

export async function sendSecurityAlert(to: string, data: Parameters<typeof SecurityAlertEmail>[0]['data']) {
  return sendEmail({ to, type: 'security-alert', data });
}

export async function sendWelcomeEmail(to: string, data: Parameters<typeof WelcomeEmail>[0]['data']) {
  return sendEmail({ to, type: 'welcome', data });
}