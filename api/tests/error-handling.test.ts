import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import Fastify from 'fastify';
import rateLimit from '@fastify/rate-limit';
import { describeError, registerErrorHandlers } from '../src/lib/error-handler.js';

async function buildTestApp() {
  const app = Fastify({ bodyLimit: 64, logger: false });
  registerErrorHandlers(app);
  await app.register(rateLimit, { global: false });

  app.get('/boom', async () => {
    throw new Error('relation "User" does not exist (postgresql://app:s3cret@10.0.0.5:5432/elevari)');
  });
  app.post('/echo', async (request) => ({ got: request.body }));
  app.get('/limited', { config: { rateLimit: { max: 1, timeWindow: '1 minute' } } }, async () => ({ ok: true }));
  await app.ready();
  return app;
}

describe('API error responses', () => {
  it('never leaks the text of an unexpected failure', async () => {
    const app = await buildTestApp();
    const response = await app.inject({ method: 'GET', url: '/boom' });

    assert.equal(response.statusCode, 500);
    assert.deepEqual(response.json(), {
      error: 'No pudimos completar la solicitud. Inténtalo de nuevo en unos minutos.',
      code: 'internal_error',
    });
    assert.ok(!response.body.includes('s3cret') && !response.body.includes('relation'));
    await app.close();
  });

  it('answers unknown routes in Spanish', async () => {
    const app = await buildTestApp();
    const response = await app.inject({ method: 'GET', url: '/nope' });

    assert.equal(response.statusCode, 404);
    assert.deepEqual(response.json(), { error: 'No encontramos lo que buscas.', code: 'not_found' });
    await app.close();
  });

  it('explains malformed JSON, oversized bodies and unsupported types', async () => {
    const app = await buildTestApp();

    const malformed = await app.inject({
      method: 'POST',
      url: '/echo',
      headers: { 'content-type': 'application/json' },
      payload: '{"a":',
    });
    assert.equal(malformed.statusCode, 400);
    assert.equal(malformed.json().code, 'invalid_json');

    const tooLarge = await app.inject({
      method: 'POST',
      url: '/echo',
      headers: { 'content-type': 'application/json' },
      payload: JSON.stringify({ text: 'x'.repeat(200) }),
    });
    assert.equal(tooLarge.statusCode, 413);
    assert.equal(tooLarge.json().code, 'payload_too_large');

    const unsupported = await app.inject({
      method: 'POST',
      url: '/echo',
      headers: { 'content-type': 'application/x-unknown' },
      payload: 'abc',
    });
    assert.equal(unsupported.statusCode, 415);
    assert.equal(unsupported.json().code, 'unsupported_media_type');
    await app.close();
  });

  it('keeps Retry-After on rate-limit answers and speaks Spanish', async () => {
    const app = await buildTestApp();
    await app.inject({ method: 'GET', url: '/limited' });
    const limited = await app.inject({ method: 'GET', url: '/limited' });

    assert.equal(limited.statusCode, 429);
    assert.equal(limited.json().code, 'rate_limited');
    assert.match(limited.json().error, /Demasiados intentos/);
    assert.ok(Number(limited.headers['retry-after']) > 0);
    await app.close();
  });

  it('describeError falls back to a safe 500 for odd values', () => {
    for (const value of [undefined, null, 'text', { statusCode: 200 }, { statusCode: 'x' }]) {
      const { status, body } = describeError(value);
      assert.equal(status, 500);
      assert.equal(body.code, 'internal_error');
    }
    assert.equal(describeError({ statusCode: 503 }).status, 503);
    assert.equal(describeError({ statusCode: 418 }).body.code, 'bad_request');
  });
});
