'use strict';

const { test, describe } = require('node:test');
const assert = require('node:assert/strict');

const {
  APP_SECRET,
  TOKEN,
  VERIFY_TOKEN,
  PHONE_NUMBER_ID,
  USER,
  MINUTE,
  HOUR,
  sign,
  createClock,
  createFakeGraph,
  deferred,
  textMessage,
  listReply,
  templateButton,
  mediaMessage,
  webhookPayload,
  startBot,
} = require('./helpers');

const OTHER = '573009998888';
const hola = () => webhookPayload([textMessage({ body: 'hola' })]);

describe('webhook authenticity (X-Hub-Signature-256)', () => {
  test('processes a correctly signed payload', async (t) => {
    const bot = await startBot(t);
    const res = await bot.say('hola');

    assert.equal(res.status, 200);
    assert.equal(res.text, 'EVENT_RECEIVED');
    assert.equal(bot.outbox().length, 1);
  });

  const rejected = [
    ['a signature made with another secret', { secret: 'someone-elses-secret' }],
    ['no signature header', { signature: null }],
    ['an empty signature header', { signature: '' }],
    ['a malformed signature', { signature: 'sha256=not-hex' }],
    ['a truncated signature', { signature: sign('x').slice(0, 40) }],
    ['the legacy sha1 scheme', { signature: `sha1=${'0'.repeat(40)}` }],
  ];
  for (const [label, options] of rejected) {
    test(`rejects ${label} with 401 and does not process the payload`, async (t) => {
      const bot = await startBot(t);
      const res = await bot.postWebhook(hola(), options);

      assert.equal(res.status, 401);
      await bot.idle();
      assert.equal(bot.graph.calls.length, 0);
      assert.equal(bot.logs.count('message.handled'), 0);
    });
  }

  test('rejects a valid signature replayed on a modified body', async (t) => {
    const bot = await startBot(t);
    const original = JSON.stringify(hola());
    const res = await bot.postWebhook(null, { raw: original.replace('hola', 'stop'), signature: sign(original) });

    assert.equal(res.status, 401);
    await bot.idle();
    assert.equal(bot.graph.calls.length, 0);
  });

  test('verifies the exact bytes received, not a re-serialisation of the parsed JSON', async (t) => {
    const bot = await startBot(t);
    // odd whitespace, escaped slash and unicode escapes parse fine but would not survive JSON.stringify
    const raw = [
      '{ "object" : "whatsapp_business_account",',
      '\t"entry": [ { "id": "WABA", "changes": [ { "field": "messages", "value": {',
      `    "metadata": { "phone_number_id": "${PHONE_NUMBER_ID}" },`,
      `    "messages": [ { "from": "${USER}", "id": "wamid.RAW", "type": "text", "text": { "body": "Hola \\u00f1and\\u00fa \\/ \\ud83d\\ude00" } } ]`,
      '} } ] } ] }',
    ].join('\n');
    assert.notEqual(raw, JSON.stringify(JSON.parse(raw)));

    const res = await bot.postWebhook(null, { raw });
    assert.equal(res.status, 200);
    await bot.idle();
    assert.equal(bot.outbox().length, 1);
  });

  test('production without WHATSAPP_APP_SECRET refuses every webhook with 503 and logs one startup error', async (t) => {
    const bot = await startBot(t, { env: { NODE_ENV: 'production', WHATSAPP_APP_SECRET: '' } });
    assert.equal(bot.logs.count('config.app_secret_missing'), 1);

    for (const options of [{ signature: null }, {}]) {
      const res = await bot.postWebhook(hola(), options);
      assert.equal(res.status, 503);
    }
    await bot.idle();
    assert.equal(bot.graph.calls.length, 0);
    assert.equal(bot.logs.count('config.app_secret_missing'), 1);
    assert.equal(bot.logs.count('webhook.refused_app_secret_missing'), 1, 'refusals are logged once per minute');

    const health = await bot.health();
    assert.equal(health.status, 200);
    assert.equal(health.json().accepting_events, false);
  });

  test('production with the secret behaves normally and logs no startup error', async (t) => {
    const bot = await startBot(t, { env: { NODE_ENV: 'production' } });
    assert.equal((await bot.say('hola')).status, 200);
    assert.equal(bot.outbox().length, 1);
    assert.equal(bot.logs.count('config.app_secret_missing'), 0);
  });

  test('outside production a missing secret still processes (local dev) with a warning', async (t) => {
    const bot = await startBot(t, { env: { WHATSAPP_APP_SECRET: '' } });
    assert.equal(bot.logs.count('config.signature_verification_disabled'), 1);

    const res = await bot.postWebhook(hola(), { signature: null });
    assert.equal(res.status, 200);
    await bot.idle();
    assert.equal(bot.outbox().length, 1);
    assert.equal(bot.logs.count('webhook.unsigned_accepted'), 1);
  });
});

describe('verification handshake (GET)', () => {
  const query = (overrides = {}) => ({
    'hub.mode': 'subscribe',
    'hub.verify_token': VERIFY_TOKEN,
    'hub.challenge': '1158201444',
    ...overrides,
  });

  test('echoes the challenge as plain text for the right token', async (t) => {
    const bot = await startBot(t);
    const res = await bot.verify(query({ 'hub.challenge': '<script>alert(1)</script>' }));

    assert.equal(res.status, 200);
    assert.equal(res.text, '<script>alert(1)</script>');
    assert.match(res.headers['content-type'], /^text\/plain/);
    assert.equal(res.headers['x-content-type-options'], 'nosniff');
  });

  const refusals = [
    ['a wrong token', query({ 'hub.verify_token': 'nope' }), 403],
    ['a wrong mode', query({ 'hub.mode': 'unsubscribe' }), 403],
    ['a missing token', { 'hub.mode': 'subscribe', 'hub.challenge': '1' }, 400],
    ['a missing mode', { 'hub.verify_token': VERIFY_TOKEN, 'hub.challenge': '1' }, 400],
    ['a missing challenge', { 'hub.mode': 'subscribe', 'hub.verify_token': VERIFY_TOKEN }, 400],
  ];
  for (const [label, params, status] of refusals) {
    test(`answers ${status} for ${label}`, async (t) => {
      const bot = await startBot(t);
      const res = await bot.verify(params);
      assert.equal(res.status, status);
      assert.ok(!res.text.includes('1158201444'));
    });
  }

  test('rejects repeated parameters instead of guessing', async (t) => {
    const bot = await startBot(t);
    const res = await bot.request('GET', `/webhook/whatsapp?hub.mode=subscribe&hub.mode=subscribe&hub.verify_token=${VERIFY_TOKEN}&hub.challenge=1`);
    assert.equal(res.status, 400);
  });

  test('never verifies while WHATSAPP_VERIFY_TOKEN is unset, whatever token is guessed', async (t) => {
    const bot = await startBot(t, { env: { WHATSAPP_VERIFY_TOKEN: '' } });
    for (const guess of ['undefined', 'null', 'x', VERIFY_TOKEN]) {
      assert.equal((await bot.verify(query({ 'hub.verify_token': guess }))).status, 403, guess);
    }
  });
});

describe('acknowledgement and robustness', () => {
  test('answers 200 before the reply has been sent to WhatsApp', { timeout: 5000 }, async (t) => {
    const gate = deferred();
    const graph = createFakeGraph();
    graph.hold(gate.promise);
    const bot = await startBot(t, { graph });

    const res = await bot.postWebhook(hola());
    assert.equal(res.status, 200);
    assert.equal(graph.sent.length, 1, 'processing has started');
    assert.equal(bot.logs.count('message.handled'), 0, 'but the Graph API call is still pending');

    gate.resolve();
    await bot.idle();
    assert.equal(bot.logs.count('message.handled'), 1);
  });

  test('ignores delivery statuses and never sends anything unprompted', async (t) => {
    const bot = await startBot(t);
    const statuses = [{ id: 'wamid.S1', status: 'delivered', recipient_id: USER }];
    const res = await bot.postWebhook(webhookPayload([], { statuses }));

    assert.equal(res.status, 200);
    await bot.idle();
    assert.equal(bot.graph.calls.length, 0);
  });

  test('ignores messages addressed to another number of the same Meta app', async (t) => {
    const bot = await startBot(t);
    await bot.postWebhook(webhookPayload([textMessage({ body: 'hola' })], { phoneNumberId: '999000111' }));
    await bot.idle();
    assert.equal(bot.graph.calls.length, 0);
  });

  test('survives malformed, odd-shaped and oversized bodies', async (t) => {
    const bot = await startBot(t);

    const malformed = await bot.postWebhook(null, { raw: '{"entry": [' });
    assert.equal(malformed.status, 400);
    assert.doesNotMatch(malformed.text, /entry|Syntax|Unexpected/);

    for (const raw of ['{}', '[]', '{"entry":"x"}', '{"entry":[null,{"changes":[{"value":{"messages":[1,"x",null]}}]}]}']) {
      assert.equal((await bot.postWebhook(null, { raw })).status, 200, raw);
    }

    const huge = await bot.postWebhook(null, { raw: `{"pad":"${'a'.repeat(1_100_000)}"}` });
    assert.equal(huge.status, 413);

    await bot.idle();
    assert.equal(bot.graph.calls.length, 0);
    assert.equal((await bot.health()).status, 200);
  });

  test('an unexpected error while handling a message is contained and logged without its content', async (t) => {
    const clock = createClock();
    let explode = false;
    const flaky = {
      advance: clock.advance,
      now: () => {
        if (explode) throw new Error(`boom for ${USER}`);
        return clock.now();
      },
    };
    const bot = await startBot(t, { clock: flaky });

    explode = true;
    assert.equal((await bot.say('hola')).status, 200);
    assert.equal(bot.logs.count('message.failed'), 1);
    assert.ok(!bot.logs.lines.join('\n').includes(USER));

    explode = false;
    await bot.say('hola');
    assert.equal(bot.outbox().length, 1);
  });

  test('the old /chat placeholder is gone', async (t) => {
    const bot = await startBot(t);
    const res = await bot.request('POST', '/chat', { headers: { 'content-type': 'application/json', 'content-length': 2 }, body: '{}' });
    assert.equal(res.status, 404);
  });
});

describe('/health', () => {
  test('reports flags only, never values', async (t) => {
    const bot = await startBot(t);
    const res = await bot.health();

    assert.equal(res.status, 200);
    assert.deepEqual(res.json(), {
      status: 'ok',
      service: 'elevari-bot',
      replies_enabled: true,
      signature_verification: 'enabled',
      verify_token: 'configured',
      accepting_events: true,
    });
    for (const secret of [TOKEN, APP_SECRET, VERIFY_TOKEN, PHONE_NUMBER_ID]) assert.ok(!res.text.includes(secret));
  });

  test('is 200 with nothing configured, and replies are simply disabled', async (t) => {
    const empty = { WHATSAPP_TOKEN: '', WHATSAPP_PHONE_NUMBER_ID: '', WHATSAPP_VERIFY_TOKEN: '', WHATSAPP_APP_SECRET: '' };
    const bot = await startBot(t, { env: empty });

    const res = await bot.health();
    assert.equal(res.status, 200);
    assert.deepEqual(
      [res.json().replies_enabled, res.json().signature_verification, res.json().verify_token],
      [false, 'missing', 'missing'],
    );

    const warning = bot.logs.entries().find((entry) => entry.event === 'config.replies_disabled');
    assert.deepEqual(warning.missing, ['WHATSAPP_TOKEN', 'WHATSAPP_PHONE_NUMBER_ID']);

    await bot.say('hola');
    assert.equal(bot.graph.calls.length, 0);
  });
});

describe('inbound message handling', () => {
  test('processes a redelivered message id only once', async (t) => {
    const bot = await startBot(t);
    const payload = webhookPayload([textMessage({ body: 'hola', id: 'wamid.DUP' })]);

    await bot.postWebhook(payload);
    await bot.postWebhook(payload);
    await bot.idle();
    assert.equal(bot.outbox().length, 1);
  });

  test('dedupes a redelivery that arrives while the first one is still in flight', { timeout: 5000 }, async (t) => {
    const gate = deferred();
    const graph = createFakeGraph();
    graph.hold(gate.promise);
    const bot = await startBot(t, { graph });
    const payload = webhookPayload([textMessage({ body: 'hola', id: 'wamid.SLOW' })]);

    await bot.postWebhook(payload);
    await bot.postWebhook(payload);
    gate.resolve();
    await bot.idle();
    assert.equal(bot.outbox().length, 1);
  });

  test('forgets message ids after 10 minutes', async (t) => {
    const bot = await startBot(t);
    const payload = webhookPayload([textMessage({ body: 'hola', id: 'wamid.OLD' })]);

    await bot.postWebhook(payload);
    bot.clock.advance(10 * MINUTE - 1);
    await bot.postWebhook(payload);
    await bot.idle();
    assert.equal(bot.outbox().length, 1);

    bot.clock.advance(1);
    await bot.postWebhook(payload);
    await bot.idle();
    assert.equal(bot.outbox().length, 2);
  });

  test('handles a duplicate inside a single payload once', async (t) => {
    const bot = await startBot(t);
    const message = textMessage({ body: 'hola', id: 'wamid.TWICE' });
    await bot.postWebhook(webhookPayload([message, message]));
    await bot.idle();
    assert.equal(bot.outbox().length, 1);
  });

  test('silently drops what a sender sends beyond 15 messages a minute, and recovers afterwards', async (t) => {
    const bot = await startBot(t);
    const burst = Array.from({ length: 20 }, () => textMessage({ body: 'menu' }));
    await bot.postWebhook(webhookPayload([...burst, textMessage({ body: 'menu', from: OTHER })]));
    await bot.idle();

    const to = (number) => bot.outbox().filter((message) => message.to === number).length;
    assert.equal(to(USER), 15, 'one reply per inbound message, none past the limit');
    assert.equal(to(OTHER), 1, 'other senders are not affected');
    assert.equal(bot.logs.count('message.rate_limited'), 1, 'the burst is logged once, not per message');

    bot.clock.advance(MINUTE + 1);
    await bot.say('menu');
    assert.equal(to(USER), 16);
  });

  test('marks answered messages as read, and leaves silent ones alone', async (t) => {
    const bot = await startBot(t);
    await bot.say('hola', { id: 'wamid.READ1' });
    assert.deepEqual(bot.graph.reads.map((call) => call.body.message_id), ['wamid.READ1']);

    await bot.say('gracias', { id: 'wamid.READ2' });
    assert.equal(bot.graph.reads.length, 1);
    assert.equal(bot.outbox().length, 1);
  });
});

describe('conversation', () => {
  test('English greeting → interactive menu → list pick → link to the refund page', async (t) => {
    const bot = await startBot(t);
    await bot.say('Hello', { name: 'Camila Pérez' });

    const [menu] = bot.outbox();
    assert.equal(menu.to, USER);
    assert.equal(menu.type, 'interactive');
    assert.match(menu.interactive.body.text, /Hi, Camila!/);
    assert.deepEqual(
      menu.interactive.action.sections[0].rows.map((row) => row.title),
      ['Explore & book', 'My booking', 'Payments & refunds', 'Become a host', 'Talk to a person'],
    );

    await bot.postWebhook(webhookPayload([listReply({ rowId: 'opt_payments', title: 'Payments & refunds' })]));
    await bot.idle();
    assert.equal(bot.outbox()[1].type, 'text');
    assert.match(bot.texts()[1], /cancellation policy/);
    assert.ok(bot.texts()[1].includes('https://example.test/legal/refund'));
  });

  test('Spanish digits answer with the matching link', async (t) => {
    const bot = await startBot(t);
    for (const digit of ['1', '2', '3', '4']) await bot.say(digit);
    const links = ['/properties', '/account', '/legal/refund', '/host'];
    bot.texts().forEach((text, index) => assert.ok(text.includes(`https://example.test${links[index]}`), text));
  });

  test('a template quick-reply button saying "Stop" opts the sender out', async (t) => {
    const bot = await startBot(t);
    await bot.postWebhook(webhookPayload([templateButton({ payload: 'PROMO_STOP', text: 'Stop promotions' })]));
    await bot.idle();
    assert.equal(bot.outbox().length, 1);
    await bot.say('1');
    assert.equal(bot.outbox().length, 1);
  });

  test('human handoff keeps the bot quiet for 12 hours for that sender only', async (t) => {
    const bot = await startBot(t);
    await bot.say('quiero hablar con un asesor');
    assert.match(bot.texts()[0], /reserve@elevari\.live/);

    for (const text of ['hola', '1', 'gracias', 'hello?']) await bot.say(text);
    assert.equal(bot.outbox().length, 1, 'quiet during the handoff');

    await bot.say('hola', { from: OTHER });
    assert.equal(bot.outbox().length, 2, 'other guests are unaffected');

    bot.clock.advance(12 * HOUR - 1);
    await bot.say('hola');
    assert.equal(bot.outbox().length, 2);

    bot.clock.advance(1);
    await bot.say('hola');
    assert.equal(bot.outbox().length, 3);
    assert.equal(bot.outbox()[2].type, 'interactive');
  });

  test('menu and stop are the only things that break a handoff silence', async (t) => {
    const bot = await startBot(t);
    await bot.say('humano');
    await bot.say('menu');
    assert.equal(bot.outbox()[1].type, 'interactive');
    await bot.say('1');
    assert.equal(bot.outbox().length, 3);

    await bot.say('agent');
    await bot.say('stop');
    assert.equal(bot.outbox().length, 5);
  });

  test('opt-out: confirms once, then silence until menu', async (t) => {
    const bot = await startBot(t);
    await bot.say('STOP');
    assert.equal(bot.outbox().length, 1);

    for (const text of ['gracias', '1', 'hi', 'ayuda', 'stop']) await bot.say(text);
    assert.equal(bot.outbox().length, 1);

    await bot.say('menu');
    assert.equal(bot.outbox().length, 2);
    await bot.say('1');
    assert.equal(bot.outbox().length, 3);
  });

  test('unknown text gets one pointer to the menu per 5 minutes, then silence', async (t) => {
    const bot = await startBot(t);
    await bot.say('asdf qwer');
    await bot.say('zxcv tyui');
    assert.equal(bot.outbox().length, 1);
    assert.match(bot.texts()[0], /\*menu\*/);

    bot.clock.advance(5 * MINUTE);
    await bot.say('otra cosa');
    assert.equal(bot.outbox().length, 2);
  });

  test('audio and other media get one short "text only" note per 5 minutes', async (t) => {
    const bot = await startBot(t);
    await bot.postWebhook(webhookPayload([mediaMessage({ type: 'audio' })]));
    await bot.postWebhook(webhookPayload([mediaMessage({ type: 'image' })]));
    await bot.idle();

    assert.equal(bot.outbox().length, 1);
    assert.match(bot.texts()[0], /solo puedo leer mensajes de texto/);
  });
});

describe('Graph API failures', () => {
  test('a retried 500 still delivers exactly one reply', async (t) => {
    const bot = await startBot(t);
    bot.graph.script({ status: 500 }, { status: 200 });
    await bot.say('hola');

    assert.equal(bot.outbox().length, 2, 'initial attempt + one retry');
    assert.equal(bot.logs.count('graph.send_failed'), 0);
    assert.equal(bot.logs.entries().find((entry) => entry.event === 'message.handled').replied, true);
  });

  test('a reply that could not be delivered does not start a handoff silence or use up the fallback cooldown', async (t) => {
    const bot = await startBot(t);
    bot.graph.script(new TypeError('fetch failed'), { status: 500 });
    await bot.say('humano');
    assert.equal(bot.logs.count('graph.send_failed'), 1);

    await bot.say('hola');
    assert.equal(bot.outbox().at(-1).type, 'interactive', 'the user is not left silenced');

    bot.graph.script({ status: 503 }, { status: 503 });
    await bot.say('asdf qwer');
    await bot.say('zxcv tyui');
    assert.match(bot.texts().at(-1), /\*menu\*/, 'the fallback is retried on the next message');
  });

  test('an opt-out is honoured even when its confirmation cannot be delivered', async (t) => {
    const bot = await startBot(t);
    bot.graph.script({ status: 500 }, { status: 500 });
    await bot.say('stop');
    const sentSoFar = bot.outbox().length;

    await bot.say('1');
    assert.equal(bot.outbox().length, sentSoFar);
    assert.equal((await bot.health()).status, 200);
  });
});

describe('privacy', () => {
  test('logs carry no phone numbers, message text, profile names, tokens or secrets', async (t) => {
    const captured = [];
    for (const method of ['log', 'warn', 'error']) t.mock.method(console, method, (line) => captured.push(String(line)));
    const bot = await startBot(t, { consoleLogs: true });

    bot.graph.script({ status: 500 }, { status: 500 });
    await bot.say('Quiero reservar para Juan Gómez, mi cédula es 1020304050', { name: 'Camila Pérez' });
    await bot.say('humano', { name: 'Camila Pérez' });
    await bot.postWebhook(hola(), { secret: 'wrong-secret' });
    await bot.postWebhook(null, { raw: `{"broken": "${USER}"` });
    await bot.verify({ 'hub.mode': 'subscribe', 'hub.verify_token': `wrong-token-${USER}`, 'hub.challenge': '1' });
    await bot.idle();

    const output = captured.join('\n');
    assert.ok(output.includes('***4567'), 'the masked sender is logged');
    const leaks = [USER, '3001234567', '1020304050', 'Gómez', 'Camila', 'cédula', TOKEN, APP_SECRET, VERIFY_TOKEN, 'wrong-secret', 'wrong-token'];
    for (const leak of leaks) assert.ok(!output.includes(leak), `log output leaks ${leak}`);
  });
});
