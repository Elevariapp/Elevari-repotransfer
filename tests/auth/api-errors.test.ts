import { describe, expect, it } from 'vitest';
import { humanizeApiError } from '../../lib/api-errors';

describe('humanizeApiError', () => {
  it('keeps a Spanish message from the API as it is', () => {
    expect(humanizeApiError('La contraseña actual no es correcta.', 'invalid_current_password', 403)).toBe(
      'La contraseña actual no es correcta.',
    );
  });

  it('never shows Fastify English status text, whatever the status', () => {
    expect(humanizeApiError('Internal Server Error', undefined, 500)).toMatch(/problema de nuestro lado/);
    expect(humanizeApiError('Bad Gateway', undefined, 502)).toMatch(/problema de nuestro lado/);
    expect(humanizeApiError('Service Unavailable', undefined, 503)).toMatch(/problema de nuestro lado/);
    expect(humanizeApiError('Not Found', undefined, 404)).toBe('No encontramos lo que buscas.');
    expect(humanizeApiError('Payload Too Large', undefined, 413)).toMatch(/demasiado grandes/);
  });

  it('explains answers without a body (proxy or CDN error pages)', () => {
    expect(humanizeApiError('Request failed', undefined, 504)).toMatch(/problema de nuestro lado/);
    expect(humanizeApiError('Request failed', undefined, 429)).toMatch(/Demasiados intentos/);
    expect(humanizeApiError('Request failed', undefined, 400)).toMatch(/Revisa los datos/);
  });

  it('maps the generic codes the API now sends', () => {
    expect(humanizeApiError('anything', 'internal_error', 500)).toMatch(/problema de nuestro lado/);
    expect(humanizeApiError('anything', 'rate_limited', 429)).toMatch(/Demasiados intentos/);
    expect(humanizeApiError('', 'timeout')).toMatch(/tardó demasiado/);
  });

  it('still falls back to the old generic sentence when the status is unknown', () => {
    expect(humanizeApiError('Request failed')).toBe('No pudimos completar la solicitud. Inténtalo de nuevo.');
  });
});
