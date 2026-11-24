const SHORT_DATE = new Intl.DateTimeFormat('es-CO', { day: 'numeric', month: 'short', timeZone: 'UTC' });

/** "3 dic → 5 dic". Check-in and check-out are calendar dates stored at UTC midnight. */
export function stayRange(checkIn: Date, checkOut: Date): string {
  return `${SHORT_DATE.format(checkIn)} → ${SHORT_DATE.format(checkOut)}`;
}

export type BookingNotificationType =
  | 'booking_confirmed'
  | 'booking_cancelled'
  | 'booking_expired'
  | 'checked_in'
  | 'stay_completed'
  | 'host_new_booking'
  | 'host_booking_cancelled'
  | 'check_in_soon';

/** One wording for the in-app feed and for push, so a notification reads the same everywhere. */
export function bookingNotificationCopy(
  type: BookingNotificationType,
  { property, dates, isToday = false }: { property: string; dates: string; isToday?: boolean },
): { title: string; body: string } {
  switch (type) {
    case 'booking_confirmed':
      return { title: 'Reserva confirmada', body: `${property} · ${dates}` };
    case 'booking_cancelled':
      return { title: 'Reserva cancelada', body: `${property} · ${dates}` };
    case 'booking_expired':
      return { title: 'Reserva expirada', body: `${property}: el pago no se completó a tiempo y las fechas se liberaron.` };
    case 'checked_in':
      return { title: 'Check-in registrado', body: `${property}. ¡Que disfrutes tu estadía!` };
    case 'stay_completed':
      return { title: 'Estadía completada', body: `Gracias por hospedarte en ${property}.` };
    case 'host_new_booking':
      return { title: 'Nueva reserva', body: `${property} · ${dates}` };
    case 'host_booking_cancelled':
      return { title: 'Reserva cancelada', body: `${property} · ${dates}` };
    case 'check_in_soon':
      return { title: isToday ? 'Tu check-in es hoy' : 'Tu check-in es mañana', body: property };
  }
}
