import type { FastifyInstance } from 'fastify';

export interface ErrorBody {
  error: string;
  code: string;
}

const SERVER_ERROR: ErrorBody = {
  error: 'No pudimos completar la solicitud. Inténtalo de nuevo en unos minutos.',
  code: 'internal_error',
};

const CLIENT_ERRORS: Record<number, ErrorBody> = {
  400: { error: 'Revisa los datos enviados e inténtalo de nuevo.', code: 'bad_request' },
  401: { error: 'Inicia sesión para continuar.', code: 'unauthorized' },
  403: { error: 'No tienes permiso para hacer esto.', code: 'forbidden' },
  404: { error: 'No encontramos lo que buscas.', code: 'not_found' },
  405: { error: 'Esta acción no está disponible.', code: 'method_not_allowed' },
  408: { error: 'La solicitud tardó demasiado. Inténtalo de nuevo.', code: 'request_timeout' },
  413: { error: 'Los datos o el archivo enviado son demasiado grandes.', code: 'payload_too_large' },
  415: { error: 'El formato de los datos enviados no es compatible.', code: 'unsupported_media_type' },
  429: { error: 'Demasiados intentos. Espera un momento e inténtalo de nuevo.', code: 'rate_limited' },
};

const MALFORMED_JSON: ErrorBody = {
  error: 'No pudimos leer los datos enviados. Inténtalo de nuevo.',
  code: 'invalid_json',
};

/**
 * Maps anything thrown while handling a request to a status and a Spanish body. Fastify's stock
 * answers are English and, for unexpected failures, echo `error.message` (driver and ORM text).
 */
export function describeError(error: unknown): { status: number; body: ErrorBody } {
  const candidate = error as { statusCode?: unknown; code?: unknown } | null | undefined;
  const statusCode = typeof candidate?.statusCode === 'number' ? candidate.statusCode : 500;

  if (statusCode < 400 || statusCode >= 500) {
    return { status: statusCode >= 500 && statusCode < 600 ? statusCode : 500, body: SERVER_ERROR };
  }

  const code = typeof candidate?.code === 'string' ? candidate.code : '';
  if (statusCode === 400 && /^FST_ERR_CTP_(INVALID|EMPTY)_JSON_BODY$/.test(code)) {
    return { status: 400, body: MALFORMED_JSON };
  }
  return { status: statusCode, body: CLIENT_ERRORS[statusCode] ?? CLIENT_ERRORS[400] };
}

export function registerErrorHandlers(app: FastifyInstance) {
  app.setErrorHandler((error, request, reply) => {
    const { status, body } = describeError(error);
    if (status >= 500) request.log.error({ err: error }, 'request failed');
    return reply.status(status).send(body);
  });

  app.setNotFoundHandler((_request, reply) => reply.status(404).send(CLIENT_ERRORS[404]));
}
