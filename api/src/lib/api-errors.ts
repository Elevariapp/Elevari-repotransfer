export const ApiErrorCode = {
  INVALID_DATE_RANGE: 'INVALID_DATE_RANGE',
  DATES_NOT_AVAILABLE: 'DATES_NOT_AVAILABLE',
  MAX_GUESTS_EXCEEDED: 'MAX_GUESTS_EXCEEDED',
  INVALID_BODY: 'INVALID_BODY',
  INVALID_QUERY: 'INVALID_QUERY',
  PROPERTY_NOT_FOUND: 'PROPERTY_NOT_FOUND',
} as const;

export type ApiErrorCodeValue = (typeof ApiErrorCode)[keyof typeof ApiErrorCode];

const MESSAGES: Record<ApiErrorCodeValue, string> = {
  INVALID_DATE_RANGE: 'La fecha de salida debe ser al menos un día después de la entrada.',
  DATES_NOT_AVAILABLE: 'Estas fechas ya no están disponibles. Elige otro rango.',
  MAX_GUESTS_EXCEEDED: 'Superaste el máximo de huéspedes permitido para esta propiedad.',
  INVALID_BODY: 'Revisa los datos enviados e inténtalo de nuevo.',
  INVALID_QUERY: 'Los filtros de búsqueda no son válidos. Revisa las fechas e inténtalo de nuevo.',
  PROPERTY_NOT_FOUND: 'No encontramos esta propiedad.',
};

export function apiErrorBody(
  code: ApiErrorCodeValue,
  overrides?: { message?: string; details?: unknown },
) {
  return {
    error: overrides?.message ?? MESSAGES[code],
    code,
    ...(overrides?.details !== undefined ? { details: overrides.details } : {}),
  };
}

export function maxGuestsError(max: number) {
  return apiErrorBody(ApiErrorCode.MAX_GUESTS_EXCEEDED, {
    message: `El máximo de huéspedes para esta propiedad es ${max}.`,
  });
}
