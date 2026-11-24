import { after, before, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { hasTestDatabase, linkToken, skipReason, startStack, type TestStack } from './harness.js';

describe('login lockout API (real database)', { skip: hasTestDatabase ? false : skipReason }, () => {
  let stack: TestStack;

  before(async () => {
    stack = await startStack();
  });
  after(async () => {
    await stack.stop();
  });

  describe('per-account login lockout', () => {
    it('locks an address after repeated failures, even for the right password, and unlocks on success elsewhere', async () => {
      const user = await stack.registerUser();
      for (let attempt = 0; attempt < 10; attempt += 1) {
        const wrong = await stack.call('POST', '/auth/login', { body: { email: user.email, password: 'incorrecta-1' } });
        assert.equal(wrong.status, 401);
      }

      const locked = await stack.call('POST', '/auth/login', { body: { email: user.email, password: user.password } });
      assert.equal(locked.status, 429);
      assert.equal(locked.body.code, 'login_locked');
      assert.match(locked.body.error, /Demasiados intentos/);
      assert.ok(Number(locked.headers['retry-after']) > 0);

      const other = await stack.registerUser();
      const fine = await stack.call('POST', '/auth/login', { body: { email: other.email, password: other.password } });
      assert.equal(fine.status, 200);
    });

    it('locks unknown addresses the same way, so the lock cannot be used to find accounts', async () => {
      const email = `ghost.${randomUUID()}@example.test`;
      for (let attempt = 0; attempt < 10; attempt += 1) {
        await stack.call('POST', '/auth/login', { body: { email, password: 'incorrecta-1' } });
      }
      const locked = await stack.call('POST', '/auth/login', { body: { email, password: 'incorrecta-1' } });
      assert.equal(locked.status, 429);
      assert.equal(locked.body.code, 'login_locked');
    });

    it('a successful login clears earlier failures', async () => {
      const user = await stack.registerUser();
      for (let attempt = 0; attempt < 9; attempt += 1) {
        await stack.call('POST', '/auth/login', { body: { email: user.email, password: 'incorrecta-1' } });
      }
      const ok = await stack.call('POST', '/auth/login', { body: { email: user.email, password: user.password } });
      assert.equal(ok.status, 200);
      const wrongAgain = await stack.call('POST', '/auth/login', { body: { email: user.email, password: 'incorrecta-1' } });
      assert.equal(wrongAgain.status, 401);
    });

    it('resetting the password through the e-mailed link lifts the lock', async () => {
      const user = await stack.registerUser();
      for (let attempt = 0; attempt < 10; attempt += 1) {
        await stack.call('POST', '/auth/login', { body: { email: user.email, password: 'incorrecta-1' } });
      }
      assert.equal((await stack.call('POST', '/auth/login', { body: { email: user.email, password: 'incorrecta-1' } })).status, 429);

      await stack.call('POST', '/auth/forgot-password', { body: { email: user.email } });
      const mail = await stack.waitForEmail((e) => e.to.includes(user.email) && /Restablec/i.test(e.subject));
      const token = linkToken(mail, '/auth/reset-password');
      assert.ok(token);
      const reset = await stack.call('POST', '/auth/reset-password', { body: { token, password: 'OtraClave#2027' } });
      assert.equal(reset.status, 200);

      const login = await stack.call('POST', '/auth/login', { body: { email: user.email, password: 'OtraClave#2027' } });
      assert.equal(login.status, 200);
    });
  });
});
