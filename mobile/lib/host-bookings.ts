import type { StatusTone } from './booking';
import type { HostBookingScope } from './types';

export const HOST_BOOKING_SCOPES: ReadonlyArray<{ value: HostBookingScope; label: string }> = [
  { value: 'upcoming', label: 'Próximas' },
  { value: 'past', label: 'Pasadas' },
  { value: 'cancelled', label: 'Canceladas' },
];

export const HOST_BOOKINGS_EMPTY: Record<HostBookingScope, { title: string; message: string }> = {
  upcoming: {
    title: 'Aún no tienes reservas próximas',
    message: 'Cuando un huésped reserve y pague, la verás aquí y te avisaremos en la app y por correo.',
  },
  past: {
    title: 'Todavía no hay estadías finalizadas',
    message: 'Aquí quedará el historial de las estadías que ya terminaron.',
  },
  cancelled: {
    title: 'No tienes reservas canceladas',
    message: 'Si un huésped cancela una reserva que ya había pagado, la verás aquí.',
  },
};

// Stays that already ended are "finalizadas" even if nobody marked them completed.
export function hostBookingStatus(scope: HostBookingScope, status: string): { label: string; tone: StatusTone } {
  if (status === 'cancelled') return { label: 'Cancelada', tone: 'danger' };
  if (scope === 'past' || status === 'completed') return { label: 'Finalizada', tone: 'neutral' };
  if (status === 'checked_in') return { label: 'En curso', tone: 'info' };
  return { label: 'Confirmada', tone: 'success' };
}

// A cancelled booking pays the host nothing, so it is phrased as what they would have received.
export function hostReceivesLabel(status: string): string {
  return status === 'cancelled' ? 'Habrías recibido' : 'Recibes';
}
