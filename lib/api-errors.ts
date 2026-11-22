const CODE_MESSAGES: Record<string, string> = {
  INVALID_DATE_RANGE: 'La fecha de salida debe ser al menos un día después de la entrada.',
  DATES_NOT_AVAILABLE: 'Estas fechas ya no están disponibles. Elige otro rango.',
  MAX_GUESTS_EXCEEDED: 'Superaste el máximo de huéspedes permitido para esta propiedad.',
  INVALID_BODY: 'Revisa los datos enviados e inténtalo de nuevo.',
  INVALID_QUERY: 'Los filtros de búsqueda no son válidos. Revisa las fechas e inténtalo de nuevo.',
  PROPERTY_NOT_FOUND: 'No encontramos esta propiedad.',
};

const LEGACY_MESSAGES: Record<string, string> = {
  'check_out must be after check_in': CODE_MESSAGES.INVALID_DATE_RANGE,
  'Dates are no longer available': CODE_MESSAGES.DATES_NOT_AVAILABLE,
  'DATES_NOT_AVAILABLE': CODE_MESSAGES.DATES_NOT_AVAILABLE,
  'Property not found': CODE_MESSAGES.PROPERTY_NOT_FOUND,
  'Invalid query': CODE_MESSAGES.INVALID_QUERY,
  'Invalid body': CODE_MESSAGES.INVALID_BODY,
  'Request failed': 'No pudimos completar la solicitud. Inténtalo de nuevo.',
};

/** Map API error codes / legacy English strings to guest-friendly Spanish. */
export function humanizeApiError(message: string, code?: string): string {
  if (code && CODE_MESSAGES[code]) return CODE_MESSAGES[code];
  if (LEGACY_MESSAGES[message]) return LEGACY_MESSAGES[message];
  if (message.startsWith('Max guests is ')) {
    const max = message.replace('Max guests is ', '');
    return `El máximo de huéspedes para esta propiedad es ${max}.`;
  }
  return message;
}
