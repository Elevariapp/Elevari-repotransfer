import axios, { AxiosError, AxiosRequestConfig } from 'axios';
import Constants from 'expo-constants';
import { authStorage } from './auth';
import type { ApiErrorBody } from './types';

const DEFAULT_API_BASE_URL = 'https://elevari.live/api/v1';
const REQUEST_TIMEOUT_MS = 20000;

// Endpoints where a 401 means "wrong credentials", never "your session expired".
const CREDENTIAL_ENDPOINT = /^\/?auth\/(login|register|google|forgot-password|reset-password|smoke-login)\b/;
// The endpoint that hands back a fresh token (the previous one is revoked by the server).
const TOKEN_ROTATION_ENDPOINT = /^\/?auth\/change-password\b/;
// Legacy password-check codes: the session is fine even if an older API answers them with a 401.
const PASSWORD_CHECK_CODES = new Set(['invalid_current_password', 'invalid_password']);

function readExtraBaseUrl(): string | undefined {
  const extra = Constants.expoConfig?.extra as { API_BASE_URL?: unknown } | undefined;
  return typeof extra?.API_BASE_URL === 'string' ? extra.API_BASE_URL : undefined;
}

// The base URL must include `/api/v1`; an origin-only value gets the prefix appended.
export function resolveApiBaseUrl(raw: string | undefined): string {
  const value = (raw ?? '').trim().replace(/\/+$/, '');
  if (!/^https?:\/\//i.test(value)) return DEFAULT_API_BASE_URL;
  return /^https?:\/\/[^/]+$/i.test(value) ? `${value}/api/v1` : value;
}

export const API_BASE_URL = resolveApiBaseUrl(
  process.env.EXPO_PUBLIC_API_BASE_URL || readExtraBaseUrl(),
);

// Optional shared key the operator can use for a WAF skip rule / Turnstile bypass. Never logged.
const API_KEY = (process.env.EXPO_PUBLIC_API_KEY ?? '').trim();

const http = axios.create({
  baseURL: API_BASE_URL,
  timeout: REQUEST_TIMEOUT_MS,
  headers: { Accept: 'application/json' },
});

type SessionExpiredHandler = (info: { code?: string }) => void | Promise<void>;

let sessionExpiredHandler: SessionExpiredHandler | null = null;
let handlingExpiredSession = false;
let tokenRotations = 0;

export function setSessionExpiredHandler(handler: SessionExpiredHandler | null): void {
  sessionExpiredHandler = handler;
}

// Wraps a request that swaps the session token (change password). The server revokes the old
// token the moment it commits, so a `session_revoked` answer to any *other* request that was in
// flight meanwhile is a side effect of the rotation and must not end the session.
export async function runTokenRotation<T>(task: () => Promise<T>): Promise<T> {
  tokenRotations += 1;
  try {
    return await task();
  } finally {
    tokenRotations -= 1;
  }
}

http.interceptors.request.use(async (config) => {
  const token = await authStorage.getToken();
  if (token) config.headers.set('Authorization', `Bearer ${token}`);
  if (API_KEY) config.headers.set('x-api-key', API_KEY);
  return config;
});

function sentBearerToken(error: AxiosError): string | null {
  const header: unknown = error.config?.headers?.get('Authorization');
  return typeof header === 'string' && header.startsWith('Bearer ') ? header.slice(7) : null;
}

// Only an authenticated request answered with 401 ends the session. 403/409/400 answers
// (wrong current password, active bookings, …) never do.
async function maybeExpireSession(error: AxiosError): Promise<void> {
  if (error.response?.status !== 401 || handlingExpiredSession) return;

  const sentToken = sentBearerToken(error);
  if (!sentToken) return;
  const url = error.config?.url ?? '';
  if (CREDENTIAL_ENDPOINT.test(url)) return;
  const code = getApiErrorCode(error);
  if (PASSWORD_CHECK_CODES.has(code ?? '')) return;
  if (tokenRotations > 0 && code === 'session_revoked' && !TOKEN_ROTATION_ENDPOINT.test(url)) return;

  // A late 401 from a previous session must not log out a newer one.
  if ((await authStorage.getToken()) !== sentToken) return;

  handlingExpiredSession = true;
  try {
    await authStorage.logout();
    await sessionExpiredHandler?.({ code });
  } finally {
    handlingExpiredSession = false;
  }
}

http.interceptors.response.use(
  (response) => response,
  async (error: unknown) => {
    if (axios.isAxiosError(error)) await maybeExpireSession(error);
    return Promise.reject(error);
  },
);

// Body-less writes still send `{}`: Fastify rejects an empty body that carries a JSON content type.
export const api = {
  async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return (await http.get<T>(url, config)).data;
  },
  async post<T>(url: string, data: unknown = {}, config?: AxiosRequestConfig): Promise<T> {
    return (await http.post<T>(url, data, config)).data;
  },
  async patch<T>(url: string, data: unknown = {}, config?: AxiosRequestConfig): Promise<T> {
    return (await http.patch<T>(url, data, config)).data;
  },
  async put<T>(url: string, data: unknown = {}, config?: AxiosRequestConfig): Promise<T> {
    return (await http.put<T>(url, data, config)).data;
  },
  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return (await http.delete<T>(url, config)).data;
  },
};

const MESSAGES = {
  network: 'No pudimos conectarnos con Elevari. Revisa tu conexión a internet e inténtalo de nuevo.',
  timeout: 'La solicitud tardó demasiado. Revisa tu conexión e inténtalo de nuevo.',
  blocked:
    'No pudimos completar la conexión segura con Elevari. Inténtalo de nuevo en unos minutos o escríbenos por WhatsApp.',
  rateLimit: 'Demasiados intentos. Espera un minuto e inténtalo de nuevo.',
  server: 'El servicio no está disponible en este momento. Inténtalo de nuevo en unos minutos.',
  upstream: 'Un servicio externo no respondió correctamente. Inténtalo de nuevo en unos minutos.',
  invalid: 'Revisa los datos e inténtalo de nuevo.',
  unauthorized: 'Tu sesión expiró. Inicia sesión de nuevo.',
  forbidden: 'No tienes permiso para realizar esta acción.',
  notFound: 'No encontramos lo que buscabas.',
  conflict: 'La acción no se pudo completar por el estado actual. Actualiza e inténtalo de nuevo.',
} as const;

// The server's text for these codes is English or technical: always show ours.
const CODE_OVERRIDES: Record<string, string> = {
  turnstile_failed: 'No pudimos verificar tu solicitud. Inténtalo de nuevo en unos minutos.',
  INVALID_DATE_RANGE: 'La fecha de salida debe ser al menos un día después de la entrada.',
  DATES_NOT_AVAILABLE: 'Estas fechas ya no están disponibles. Elige otro rango.',
  MAX_GUESTS_EXCEEDED: 'Superaste el máximo de huéspedes permitido para esta propiedad.',
  INVALID_QUERY: 'La búsqueda no es válida. Revisa los filtros e inténtalo de nuevo.',
  PROPERTY_NOT_FOUND: 'No encontramos esta propiedad.',
  SESSION_INVALID: 'Tu sesión ya no es válida. Inicia sesión de nuevo.',
};

// Used only when the server sent no text of its own (its Spanish `error` otherwise wins).
const CODE_FALLBACKS: Record<string, string> = {
  invalid_current_password: 'La contraseña actual no es correcta.',
  invalid_password: 'La contraseña no es correcta.',
  invalid_confirmation: 'El correo no coincide con el de tu cuenta.',
  admin_account: 'Las cuentas de administrador no se pueden eliminar desde la app.',
  active_bookings: 'Tienes reservas activas o con pago pendiente. Cancélalas o espera a que terminen.',
  session_revoked: 'Tu sesión ya no es válida. Inicia sesión de nuevo.',
  email_taken: 'Ya existe una cuenta con este correo. Inicia sesión o recupera tu contraseña.',
};

// Older API responses that are still in English.
const LEGACY_MESSAGES: Record<string, string> = {
  'invalid email or password': 'Correo o contraseña incorrectos.',
  'email already registered': 'Ya existe una cuenta con este correo. Inicia sesión o recupera tu contraseña.',
  'authentication required': 'Inicia sesión para continuar.',
  'invalid or expired token': MESSAGES.unauthorized,
  'property not found': 'No encontramos esta propiedad.',
  'booking not found': 'No encontramos esta reserva.',
  'payment not found': 'No encontramos este pago.',
  'not authorized': MESSAGES.forbidden,
  'insufficient permissions': MESSAGES.forbidden,
  'booking already paid': 'Esta reserva ya fue pagada.',
  'booking is already cancelled': 'Esta reserva ya fue cancelada.',
  'invalid booking amount': 'No pudimos calcular el monto de esta reserva. Escríbenos para ayudarte.',
  'invalid body': 'Revisa los datos enviados e inténtalo de nuevo.',
  'invalid query': 'La búsqueda no es válida. Revisa los filtros e inténtalo de nuevo.',
  'not found': MESSAGES.notFound,
};

const FIELD_LABELS: Record<string, string> = {
  email: 'correo',
  password: 'contraseña',
  current_password: 'contraseña actual',
  name: 'nombre',
  phone: 'teléfono',
  role: 'tipo de cuenta',
  title: 'título',
  description: 'descripción',
  city: 'ciudad',
  price_per_night: 'precio por noche',
  max_guests: 'máximo de huéspedes',
  guests: 'huéspedes',
  check_in: 'fecha de entrada',
  check_out: 'fecha de salida',
};

const SPANISH_SENTENCE = /^(El|La|Los|Las|Un|Una|Debes|Ingresa|Elige|Revisa|Máximo|Mínimo)\b/;

function errorBody(err: AxiosError): ApiErrorBody & { statusCode?: unknown } {
  const data: unknown = err.response?.data;
  return data && typeof data === 'object' ? (data as ApiErrorBody) : {};
}

export function getApiErrorStatus(err: unknown): number | undefined {
  return axios.isAxiosError(err) ? err.response?.status : undefined;
}

export function getApiErrorCode(err: unknown): string | undefined {
  if (!axios.isAxiosError(err)) return undefined;
  const { code } = errorBody(err);
  return typeof code === 'string' ? code : undefined;
}

// First message of every invalid field in a 400 `INVALID_BODY` answer (`details.fieldErrors`).
// Only meaningful for endpoints whose validation messages are written in Spanish.
export function getApiFieldErrors(err: unknown): Record<string, string> {
  const result: Record<string, string> = {};
  if (!axios.isAxiosError(err)) return result;

  const details: unknown = errorBody(err).details;
  const fieldErrors = (details as { fieldErrors?: Record<string, unknown> } | null | undefined)?.fieldErrors;
  if (!fieldErrors || typeof fieldErrors !== 'object') return result;

  for (const [field, messages] of Object.entries(fieldErrors)) {
    const first = Array.isArray(messages)
      ? messages.find((message): message is string => typeof message === 'string')
      : undefined;
    if (first) result[field] = first;
  }
  return result;
}

function firstFieldError(details: unknown): string | null {
  const fieldErrors = (details as { fieldErrors?: Record<string, unknown> } | null | undefined)
    ?.fieldErrors;
  if (!fieldErrors || typeof fieldErrors !== 'object') return null;

  for (const [field, messages] of Object.entries(fieldErrors)) {
    const first = Array.isArray(messages) ? messages[0] : null;
    if (typeof first === 'string' && SPANISH_SENTENCE.test(first)) return first;
    const label = FIELD_LABELS[field];
    if (label) return `Revisa el campo «${label}».`;
  }
  return null;
}

function looksLikeHtml(err: AxiosError): boolean {
  const data: unknown = err.response?.data;
  if (typeof data === 'string' && /^\s*<(!doctype|html)/i.test(data)) return true;
  const contentType: unknown = err.response?.headers?.['content-type'];
  return typeof contentType === 'string' && contentType.includes('text/html');
}

// Turns any thrown value into a Spanish message that is safe to show to the user.
export function getApiErrorMessage(
  err: unknown,
  fallback = 'Ocurrió un error inesperado. Inténtalo de nuevo.',
): string {
  if (!axios.isAxiosError(err)) return fallback;

  if (err.code === 'ECONNABORTED' || err.code === 'ETIMEDOUT') return MESSAGES.timeout;
  if (!err.response) return err.code === 'ERR_CANCELED' ? fallback : MESSAGES.network;

  const status = err.response.status;
  if (status === 429) {
    // A locked account names its own wait ("espera 15 minutos"): the generic text would promise a minute.
    const body = errorBody(err);
    if (body.code === 'login_locked' && typeof body.error === 'string' && body.error.trim()) {
      return body.error.trim();
    }
    return MESSAGES.rateLimit;
  }

  if (looksLikeHtml(err) || typeof err.response.data === 'string') {
    if (status === 403) return MESSAGES.blocked;
    if (status >= 500) return MESSAGES.server;
    return fallback;
  }

  const body = errorBody(err);
  const code = typeof body.code === 'string' ? body.code : undefined;
  // Fastify's own error shape (`statusCode` + English `error`) is never user-facing.
  const message =
    typeof body.error === 'string' && body.error.trim() && body.statusCode === undefined
      ? body.error.trim()
      : undefined;

  if (status === 502) return MESSAGES.upstream;
  if (status >= 500 && !(status === 503 && message)) return MESSAGES.server;

  if (code && CODE_OVERRIDES[code]) return CODE_OVERRIDES[code];

  if (message) {
    const lower = message.toLowerCase();
    if (lower === 'invalid body') return firstFieldError(body.details) ?? LEGACY_MESSAGES[lower];
    if (LEGACY_MESSAGES[lower]) return LEGACY_MESSAGES[lower];
    if (lower.startsWith('booking is not payable')) {
      return 'Esta reserva ya no se puede pagar. Revisa su estado en «Mis reservas».';
    }
    if (lower.startsWith('cannot cancel booking')) {
      return 'Esta reserva ya no se puede cancelar desde la app. Escríbenos por WhatsApp para ayudarte.';
    }
    if (code === 'INVALID_BODY') return firstFieldError(body.details) ?? message;
    return message;
  }

  if (code && CODE_FALLBACKS[code]) return CODE_FALLBACKS[code];
  if (status === 401) return MESSAGES.unauthorized;
  if (status === 403) return MESSAGES.forbidden;
  if (status === 404) return MESSAGES.notFound;
  if (status === 409) return MESSAGES.conflict;
  if (status === 400 || status === 422) return MESSAGES.invalid;
  return fallback;
}