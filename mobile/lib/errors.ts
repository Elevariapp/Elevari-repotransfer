import { isAxiosError } from 'axios';

/** Spanish messages for API error codes (api/src/lib/api-errors.ts and payments). */
const CODE_MESSAGES: Record<string, string> = {
  INVALID_DATE_RANGE: 'La fecha de salida debe ser al menos un día después de la entrada.',
  DATES_NOT_AVAILABLE: 'Estas fechas ya no están disponibles. Elige otro rango.',
  MAX_GUESTS_EXCEEDED: 'Superaste el máximo de huéspedes permitido para esta propiedad.',
  INVALID_BODY: 'Revisa los datos enviados e inténtalo de nuevo.',
  INVALID_QUERY: 'Los filtros de búsqueda no son válidos.',
  PROPERTY_NOT_FOUND: 'No encontramos esta propiedad.',
  INTERNATIONAL_CHECKOUT_BLOCKED: 'El pago internacional no está disponible en este momento.',
  DISCLOSURE_REQUIRED: 'Este pago requiere una confirmación adicional que la app aún no soporta.',
  QUOTE_EXPIRED: 'La cotización expiró. Inténtalo de nuevo.',
};

/** The API returns several plain-English messages; translate the ones users can hit. */
const ENGLISH_MESSAGES: Record<string, string> = {
  'Invalid email or password': 'Correo o contraseña incorrectos.',
  'Email already registered': 'Este correo ya está registrado.',
  'Invalid body': 'Revisa los datos ingresados e inténtalo de nuevo.',
  'Invalid query': 'Los filtros de búsqueda no son válidos.',
  'Property not found': 'No encontramos esta propiedad.',
  'Booking not found': 'No encontramos esta reserva.',
  'Payment not found': 'No encontramos este pago.',
  'Authentication required': 'Inicia sesión para continuar.',
  'Invalid or expired token': 'Tu sesión expiró. Inicia sesión de nuevo.',
  'Not authorized': 'No tienes permiso para realizar esta acción.',
  'Insufficient permissions': 'No tienes permiso para realizar esta acción.',
  'Booking already paid': 'Esta reserva ya está pagada.',
  'Booking is already cancelled': 'Esta reserva ya fue cancelada.',
  'Invalid booking amount': 'El monto de la reserva no es válido.',
  'Forbidden': 'No tienes permiso para realizar esta acción.',
  'Not found': 'No encontramos lo que buscas.',
  'Upload failed': 'No se pudo subir el archivo.',
  'Too Many Requests': 'Demasiados intentos. Espera un momento e inténtalo de nuevo.',
};

const FIELD_MESSAGES: Record<string, string> = {
  email: 'Ingresa un correo electrónico válido.',
  password: 'La contraseña debe tener al menos 8 caracteres.',
  name: 'Ingresa tu nombre.',
  title: 'El título debe tener entre 3 y 120 caracteres.',
  description: 'La descripción debe tener al menos 20 caracteres.',
  city: 'Ingresa la ciudad.',
  price_per_night: 'Ingresa un precio por noche válido.',
  max_guests: 'La capacidad debe estar entre 1 y 20 huéspedes.',
  check_in: 'La fecha de entrada no es válida.',
  check_out: 'La fecha de salida no es válida.',
  guests: 'El número de huéspedes no es válido.',
};

interface ErrorBody {
  error?: unknown;
  message?: unknown;
  code?: unknown;
  details?: { fieldErrors?: Record<string, unknown> };
}

const SPANISH_HINT = /[áéíóúñ¿¡]|\b(tu|tus|intenta|reserva|pago|correo|contraseña)\b/i;

function fromBody(body: ErrorBody | undefined, status: number | undefined): string | null {
  if (!body || typeof body !== 'object') return null;

  if (typeof body.code === 'string' && CODE_MESSAGES[body.code]) {
    return CODE_MESSAGES[body.code];
  }

  // { error: { code, message } }
  let message: string | undefined;
  if (body.error && typeof body.error === 'object') {
    const nested = body.error as { code?: unknown; message?: unknown };
    if (typeof nested.code === 'string' && CODE_MESSAGES[nested.code]) return CODE_MESSAGES[nested.code];
    if (typeof nested.message === 'string') message = nested.message;
  } else if (typeof body.error === 'string') {
    message = body.error;
  } else if (typeof body.message === 'string') {
    message = body.message;
  }

  if (status === 429) return ENGLISH_MESSAGES['Too Many Requests'];

  if (message === 'Invalid body' || message === 'Invalid query') {
    const fields = body.details?.fieldErrors ? Object.keys(body.details.fieldErrors) : [];
    const known = fields.find((field) => FIELD_MESSAGES[field]);
    if (known) return FIELD_MESSAGES[known];
  }

  if (!message) return null;
  if (ENGLISH_MESSAGES[message]) return ENGLISH_MESSAGES[message];
  if (/^Booking is not payable/.test(message)) return 'Esta reserva ya no se puede pagar.';
  if (/^Idempotency key/.test(message)) return 'No pudimos procesar el pago. Inténtalo de nuevo.';

  // Messages the API already writes in Spanish (turnstile, demo accounts, etc.).
  if (SPANISH_HINT.test(message)) return message;
  return null;
}

/** Converts any thrown error into a user-facing Spanish message. */
export function getErrorMessage(err: unknown, fallback = 'Ocurrió un error. Inténtalo de nuevo.'): string {
  if (isAxiosError(err)) {
    if (!err.response) {
      return err.code === 'ECONNABORTED'
        ? 'La solicitud tardó demasiado. Inténtalo de nuevo.'
        : 'No hay conexión con Elevari. Revisa tu internet e inténtalo de nuevo.';
    }
    const status = err.response.status;
    const parsed = fromBody(err.response.data as ErrorBody | undefined, status);
    if (parsed) return parsed;
    if (status === 401) return 'Tu sesión expiró. Inicia sesión de nuevo.';
    if (status === 403) return 'No tienes permiso para realizar esta acción.';
    if (status === 404) return 'No encontramos lo que buscas.';
    if (status >= 500) return 'Elevari tuvo un problema. Inténtalo de nuevo en unos minutos.';
    return fallback;
  }
  if (err instanceof AppError) return err.message;
  return fallback;
}

/** Error with a message already written for the user (Spanish). */
export class AppError extends Error {}

export function getErrorStatus(err: unknown): number | undefined {
  return isAxiosError(err) ? err.response?.status : undefined;
}
