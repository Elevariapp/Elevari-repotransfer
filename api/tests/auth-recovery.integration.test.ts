import { after, before, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { hasTestDatabase, linkToken, skipReason, startStack, type TestStack } from './harness.js';

describe('account recovery API (real database, captured e-mail)', { skip: hasTestDatabase ? false : skipReason }, () => {
  let stack: TestStack;

  before(async () => {
    stack = await startStack();
  });
  after(async () => {
    await stack.stop();
  });

  describe('POST /auth/forgot-password', () => {
    it('answers identically for existing and unknown accounts, even when the mail provider is down', async () => {
      const user = await stack.registerUser();
      const unknown = `nobody.${randomUUID()}@example.test`;

      stack.setMailMode('fail');
      try {
        const existing = await stack.call('POST', '/auth/forgot-password', { body: { email: user.email } });
        const missing = await stack.call('POST', '/auth/forgot-password', { body: { email: unknown } });

        assert.equal(existing.status, 200);
        assert.equal(missing.status, 200);
        assert.deepEqual(existing.body, missing.body);
      } finally {
        stack.setMailMode('ok');
      }
    });

    it('does not wait for a slow mail provider (no timing oracle)', async () => {
      const user = await stack.registerUser();
      stack.setMailMode('slow');
      try {
        const existing = await stack.call('POST', '/auth/forgot-password', { body: { email: user.email } });
        assert.equal(existing.status, 200);
        assert.ok(existing.ms < 800, `responded in ${existing.ms}ms, the provider takes 1500ms`);
      } finally {
        stack.setMailMode('ok');
      }
    });

    it('sends the reset link only to the account that asked for it', async () => {
      const user = await stack.registerUser({ name: 'Marta Ríos' });
      const before = stack.emails.length;
      await stack.call('POST', '/auth/forgot-password', { body: { email: user.email.toUpperCase() } });
      const mail = await stack.waitForEmail((e) => e.to.includes(user.email) && /contraseña/i.test(e.subject));

      assert.ok(stack.emails.length > before);
      assert.ok(linkToken(mail, '/auth/reset-password'), 'the e-mail carries a reset link');
      assert.ok(mail.html.includes('https://elevari.test/auth/reset-password#token='), 'the token travels in the URL fragment, not the query');
      assert.ok(!mail.html.includes('reset-password?token='));
    });

    it('caps reset e-mails per account (inbox flooding) without changing the answer', async () => {
      const user = await stack.registerUser();
      const answers = [];
      for (let attempt = 0; attempt < 5; attempt += 1) {
        answers.push(await stack.call('POST', '/auth/forgot-password', { body: { email: user.email } }));
      }
      await new Promise((resolve) => setTimeout(resolve, 300));

      assert.ok(answers.every((answer) => answer.status === 200));
      const sent = stack.emails.filter((e) => e.to.includes(user.email) && /Restablec/i.test(e.subject));
      assert.equal(sent.length, 3);
    });

    it('says so, for every address alike, when e-mail delivery is not configured in production', async () => {
      const previous = { env: process.env.NODE_ENV, key: process.env.RESEND_API_KEY };
      process.env.NODE_ENV = 'production';
      delete process.env.RESEND_API_KEY;
      try {
        const user = await stack.registerUser();
        const existing = await stack.call('POST', '/auth/forgot-password', { body: { email: user.email } });
        const missing = await stack.call('POST', '/auth/forgot-password', {
          body: { email: `nobody.${randomUUID()}@example.test` },
        });
        assert.equal(existing.status, 503);
        assert.equal(missing.status, 503);
        assert.deepEqual(existing.body, missing.body);
        assert.equal(existing.body.code, 'email_unavailable');
      } finally {
        process.env.NODE_ENV = previous.env;
        process.env.RESEND_API_KEY = previous.key;
      }
    });
  });

  describe('password reset', () => {
    it('resets once, revokes the old session and rejects a reused link', async () => {
      const user = await stack.registerUser();
      await stack.call('POST', '/auth/forgot-password', { body: { email: user.email } });
      const mail = await stack.waitForEmail((e) => e.to.includes(user.email) && /Restablec/i.test(e.subject));
      const token = linkToken(mail, '/auth/reset-password');
      assert.ok(token);

      const reset = await stack.call('POST', '/auth/reset-password', { body: { token, password: 'NuevaClave#2027' } });
      assert.equal(reset.status, 200);

      const reused = await stack.call('POST', '/auth/reset-password', { body: { token, password: 'Tercera#Clave2028' } });
      assert.equal(reused.status, 400);
      assert.equal(reused.body.code, 'invalid_reset_token');

      const oldSession = await stack.call('GET', '/auth/me', { token: user.token });
      assert.equal(oldSession.status, 401);
      assert.equal(oldSession.body.code, 'session_revoked');

      const login = await stack.call('POST', '/auth/login', { body: { email: user.email, password: 'NuevaClave#2027' } });
      assert.equal(login.status, 200);
    });
  });
});
