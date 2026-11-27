import { api } from './api';

/**
 * Host identity verification (<1 hour). The heavy multi-file upload happens on the web page
 * (private bucket + Google Vision); the app shows the live status, the promised deadline and the
 * blue badge, and opens the upload flow in the browser so no extra native module is required.
 */
export const VERIFY_URL = 'https://elevari.live/host/verify';

export interface VerificationStatus {
  id_verified: boolean;
  id_verified_at: string | null;
  verification_id: string | null;
  verification_status: string | null;
  verdict?: string | null;
  submitted_at?: string | null;
  review_by?: string | null;
  sla_minutes?: number;
}

export async function fetchVerificationStatus(): Promise<VerificationStatus> {
  return api.get<VerificationStatus>('/auth/verification-status', { timeout: 15000 });
}

/** Human wording for the machine verdict, so the app never shows an internal reason code. */
export function verificationHeadline(status: VerificationStatus | null): string {
  if (!status) return 'No pudimos revisar tu verificación ahora.';
  if (status.id_verified) return 'Identidad verificada · insignia azul activa';
  if (status.verification_status === 'pending') {
    return status.review_by
      ? `En revisión · respuesta antes de ${new Date(status.review_by).toLocaleString()}`
      : 'En revisión · máximo 1 hora';
  }
  if (status.verification_status === 'rejected') {
    return 'Verificación rechazada · puedes volver a enviarla';
  }
  return 'Verifica tu identidad para recibir reservas';
}
