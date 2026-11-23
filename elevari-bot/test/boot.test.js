'use strict';

// Runs the real entry point (src/index.js) as a child process, the way CI and Docker do. The child gets a
// hand-built environment, so a developer's own WHATSAPP_* variables can never leak in, and without
// WHATSAPP_TOKEN the bot never calls out: nothing here can reach the Graph API.

const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const { spawn } = require('node:child_process');
const net = require('node:net');
const path = require('node:path');

const { APP_SECRET, VERIFY_TOKEN, httpRequest, sign, textMessage, webhookPayload } = require('./helpers');

const ENTRY = path.join(__dirname, '..', 'src', 'index.js');
const REJECT_SOON = 'data:text/javascript,setTimeout(() => Promise.reject(new Error("boom")), 150)';

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function freePort() {
  return new Promise((resolve, reject) => {
    const probe = net.createServer();
    probe.once('error', reject);
    probe.listen(0, '127.0.0.1', () => {
      const { port } = probe.address();
      probe.close(() => resolve(port));
    });
  });
}

async function waitFor(condition, what, timeoutMs = 10_000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (condition()) return;
    await sleep(25);
  }
  throw new Error(`timed out waiting for ${what}`);
}

async function boot(t, { env = {}, port, nodeArgs = [], waitForHealth = true } = {}) {
  const listenPort = port ?? (await freePort());
  const child = spawn(process.execPath, [...nodeArgs, ENTRY], {
    env: { PATH: process.env.PATH, HOST: '127.0.0.1', PORT: String(listenPort), ...env },
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  let output = '';
  for (const stream of [child.stdout, child.stderr]) {
    stream.on('data', (chunk) => {
      output += chunk;
    });
  }
  // 'close' (not 'exit') so that every line the bot wrote has been read
  const closed = new Promise((resolve) => child.once('close', (code, signal) => resolve({ code, signal })));
  t.after(async () => {
    if (child.exitCode === null && child.signalCode === null) child.kill('SIGKILL');
    await closed;
  });

  const bot = {
    child,
    closed,
    output: () => output,
    events: () =>
      output
        .split('\n')
        .filter((line) => line.startsWith('{'))
        .map((line) => JSON.parse(line)),
    count: (event) => bot.events().filter((entry) => entry.event === event).length,
    request: (method, urlPath, options) => httpRequest({ port: listenPort, method, path: urlPath, ...options }),
  };

  if (waitForHealth) {
    let exitedEarly = null;
    closed.then((result) => {
      exitedEarly = result;
    });
    await waitFor(
      () => {
        if (exitedEarly) throw new Error(`the bot exited during startup ${JSON.stringify(exitedEarly)}\n${output}`);
        return bot.count('server.listening') === 1;
      },
      'the bot to listen',
    );
  }
  return bot;
}

const signedPost = (bot, payload, { secret = APP_SECRET } = {}) => {
  const body = JSON.stringify(payload);
  return bot.request('POST', '/webhook/whatsapp', {
    headers: { 'content-type': 'application/json', 'content-length': Buffer.byteLength(body), 'x-hub-signature-256': sign(body, secret) },
    body,
  });
};

describe('src/index.js as a process', () => {
  test('boots with an EMPTY environment and /health answers 200 (the CI smoke test)', { timeout: 20_000 }, async (t) => {
    const bot = await boot(t);

    const health = await bot.request('GET', '/health');
    assert.equal(health.status, 200);
    assert.deepEqual(health.json(), {
      status: 'ok',
      service: 'elevari-bot',
      replies_enabled: false,
      signature_verification: 'missing',
      verify_token: 'missing',
      accepting_events: true,
    });
    assert.equal(bot.count('config.replies_disabled'), 1, 'the missing configuration is reported at startup');

    // still safe to talk to Meta-shaped traffic: it is acknowledged, nothing is answered, nothing verifies
    const post = await signedPost(bot, webhookPayload([textMessage({ body: 'hola' })]));
    assert.equal(post.status, 200);
    const handshake = await bot.request('GET', '/webhook/whatsapp?hub.mode=subscribe&hub.verify_token=guess&hub.challenge=1');
    assert.equal(handshake.status, 403);
    assert.equal(bot.count('message.handled'), 0);
  });

  test('NODE_ENV=production without WHATSAPP_APP_SECRET refuses webhooks and says so once at startup', { timeout: 20_000 }, async (t) => {
    const bot = await boot(t, { env: { NODE_ENV: 'production' } });
    assert.equal(bot.count('config.app_secret_missing'), 1);

    const payload = webhookPayload([textMessage({ body: 'hola' })]);
    assert.equal((await signedPost(bot, payload)).status, 503);
    assert.equal((await signedPost(bot, payload)).status, 503);
    assert.equal(bot.count('config.app_secret_missing'), 1);

    const health = await bot.request('GET', '/health');
    assert.equal(health.status, 200, 'the container healthcheck keeps passing');
    assert.equal(health.json().accepting_events, false);
  });

  test('with WHATSAPP_APP_SECRET set, webhooks are authenticated end to end', { timeout: 20_000 }, async (t) => {
    const bot = await boot(t, { env: { NODE_ENV: 'production', WHATSAPP_APP_SECRET: APP_SECRET, WHATSAPP_VERIFY_TOKEN: VERIFY_TOKEN } });
    const payload = webhookPayload([textMessage({ body: 'hola' })]);

    assert.equal((await signedPost(bot, payload)).status, 200);
    assert.equal((await signedPost(bot, payload, { secret: 'not-the-app-secret' })).status, 401);

    const handshake = await bot.request('GET', `/webhook/whatsapp?hub.mode=subscribe&hub.verify_token=${VERIFY_TOKEN}&hub.challenge=4242`);
    assert.deepEqual([handshake.status, handshake.text], [200, '4242']);

    const output = bot.output();
    assert.ok(!output.includes(APP_SECRET) && !output.includes(VERIFY_TOKEN), 'startup and request logs never contain secrets');
  });

  test('SIGTERM (docker stop) shuts down cleanly with exit code 0', { timeout: 20_000 }, async (t) => {
    const bot = await boot(t);
    bot.child.kill('SIGTERM');

    assert.deepEqual(await bot.closed, { code: 0, signal: null });
    assert.equal(bot.count('server.shutting_down'), 1);
  });

  test('an unhandled promise rejection is logged and does not take the bot down', { timeout: 20_000 }, async (t) => {
    const bot = await boot(t, { nodeArgs: ['--import', REJECT_SOON] });
    await waitFor(() => bot.count('process.unhandled_rejection') === 1, 'the rejection to be logged');

    assert.equal(bot.child.exitCode, null);
    assert.equal((await bot.request('GET', '/health')).status, 200);
  });

  test('exits with status 1 when its port is taken, so Docker restarts it instead of leaving a dead bot', { timeout: 20_000 }, async (t) => {
    const blocker = net.createServer();
    await new Promise((resolve) => blocker.listen(0, '127.0.0.1', resolve));
    t.after(() => new Promise((resolve) => blocker.close(resolve)));

    const bot = await boot(t, { port: blocker.address().port, waitForHealth: false });
    assert.equal((await bot.closed).code, 1);
    assert.equal(bot.count('server.failed'), 1);
  });
});
