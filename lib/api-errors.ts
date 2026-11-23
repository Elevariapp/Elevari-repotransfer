const CODE_MESSAGES: Record<string, string> = {
  INVALID_DATE_RANGE: 'La fecha de salida debe ser al menos un día después de la entrada.',
  DATES_NOT_AVAILABLE: 'Estas fechas ya no están disponibles. Elige otro rango.',
  MAX_GUESTS_EXCEEDED: 'Superaste el máximo de huéspedes permitido para esta propiedad.',
  INVALID_BODY: 'Revisa los datos enviados e inténtalo de nuevo.',
  INVALID_QUERY: 'Los filtros de búsqueda no son válidos. Revisa las fechas e inténtalo de nuevo.',
  PROPERTY_NOT_FOUND: 'No encontramos esta propiedad.',
  email_taken: 'Ya existe una cuenta con este correo. Inicia sesión o recupera tu contraseña.',
  network_error: 'No pudimos conectar con el servidor. Revisa tu conexión e inténtalo de nuevo.',
};

const LEGACY_MESSAGES: Record<string, string> = {
  'check_out must be after check_in': CODE_MESSAGES.INVALID_DATE_RANGE,
  'Dates are no longer available': CODE_MESSAGES.DATES_NOT_AVAILABLE,
  'DATES_NOT_AVAILABLE': CODE_MESSAGES.DATES_NOT_AVAILABLE,
  'Property not found': CODE_MESSAGES.PROPERTY_NOT_FOUND,
  'Invalid query': CODE_MESSAGES.INVALID_QUERY,
  'Invalid body': CODE_MESSAGES.INVALID_BODY,
  'Request failed': 'No pudimos completar la solicitud. Inténtalo de nuevo.',
  'Network error': CODE_MESSAGES.network_error,
  'Email already registered': CODE_MESSAGES.email_taken,
  'Invalid email or password': 'Correo o contraseña incorrectos.',
  'Authentication required': 'Inicia sesión para continuar.',
  'Invalid or expired token': 'Tu sesión expiró. Inicia sesión de nuevo.',
  'Insufficient permissions': 'No tienes permiso para hacer esto.',
  'Forbidden': 'No tienes permiso para hacer esto.',
  'Not found': 'No encontramos lo que buscas.',
  'Booking not found': 'No encontramos esta reserva.',
  'Booking is already cancelled': 'Esta reserva ya estaba cancelada.',
  'Not authorized': 'No tienes permiso para hacer esto.',
  'Google sign-in failed': 'No pudimos iniciar sesión con Google. Inténtalo de nuevo.',
  'Too Many Requests': 'Demasiados intentos. Espera un momento e inténtalo de nuevo.',
};

/** Map API error codes / legacy English strings to guest-friendly Spanish. */
export function humanizeApiError(message: string, code?: string): string {
  if (code && CODE_MESSAGES[code]) return CODE_MESSAGES[code];
  if (LEGACY_MESSAGES[message]) return LEGACY_MESSAGES[message];
  if (message.startsWith('Cannot cancel booking in status ')) {
    return 'Esta reserva ya no se puede cancelar. Escríbenos si necesitas ayuda.';
  }
  if (message.startsWith('Max guests is ')) {
    const max = message.replace('Max guests is ', '');
    return `El máximo de huéspedes para esta propiedad es ${max}.`;
  }
  return message;
}
