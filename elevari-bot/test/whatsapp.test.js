'use strict';

const { test, describe } = require('node:test');
const assert = require('node:assert/strict');

const { createWhatsAppClient, buildPayload } = require('../src/whatsapp');
const { route } = require('../src/concierge');
const { loadConfig, secretValues } = require('../src/config');
const { createLogger } = require('../src/logger');
const { ENV, TOKEN, USER, createFakeGraph, createLogCapture } = require('./helpers');

const NOW = Date.parse('2025-01-15T15:00:00Z');
const welcome = () => route({ text: 'hola', now: NOW }).replies[0];
const TEXT = { type: 'text', body: 'Hola' };

function setup({ env = {}, script = [] } = {}) {
  const config = loadConfig({ ...ENV, ...env });
  const graph = createFakeGraph();
  graph.script(...script);
  const logs = createLogCapture();
  const logger = createLogger({ secrets: secretValues(config), sink: logs.sink });
  const client = createWhatsAppClient({ config, fetchImpl: graph.fetchImpl, logger, retryDelayMs: 0 });
  return { client, graph, logs };
}

describe('buildPayload', () => {
  test('text message', () => {
    assert.deepEqual(buildPayload(USER, TEXT), {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: USER,
      type: 'text',
      text: { preview_url: true, body: 'Hola' },
    });
  });

  test('interactive list message', () => {
    const reply = welcome();
    const payload = buildPayload(USER, reply);

    assert.equal(payload.messaging_product, 'whatsapp');
    assert.equal(payload.to, USER);
    assert.equal(payload.type, 'interactive');
    assert.deepEqual(payload.interactive, {
      type: 'list',
      body: { text: reply.body },
      footer: { text: reply.footer },
      action: {
        button: reply.button,
        sections: [{ title: reply.sectionTitle, rows: reply.rows.map(({ id, title }) => ({ id, title })) }],
      },
    });
    assert.equal(payload.interactive.action.sections[0].rows.length, 5);
  });
});

describe('Graph API requests', () => {
  test('POST to the versioned messages endpoint with the bearer token and a timeout signal', async () => {
    const { client, graph } = setup();
    assert.deepEqual(await client.send(USER, TEXT), { ok: true, status: 200, attempts: 1 });

    const [call] = graph.calls;
    assert.equal(call.url, 'https://graph.facebook.com/v21.0/100200300/messages');
    assert.equal(call.method, 'POST');
    assert.equal(call.headers.Authorization, `Bearer ${TOKEN}`);
    assert.equal(call.headers['Content-Type'], 'application/json');
    assert.ok(call.signal instanceof AbortSignal && !call.signal.aborted);
    assert.equal(call.body.to, USER);
  });

  test('honours GRAPH_API_VERSION and ignores malformed values', async () => {
    const custom = setup({ env: { GRAPH_API_VERSION: 'v22.0' } });
    await custom.client.send(USER, TEXT);
    assert.match(custom.graph.calls[0].url, /\/v22\.0\/100200300\/messages$/);

    const bad = setup({ env: { GRAPH_API_VERSION: '../../latest' } });
    await bad.client.send(USER, TEXT);
    assert.match(bad.graph.calls[0].url, /\/v21\.0\/100200300\/messages$/);
  });

  test('marks an inbound message as read with one best-effort attempt', async () => {
    const { client, graph, logs } = setup();
    assert.equal((await client.markRead('wamid.ABC')).ok, true);
    assert.deepEqual(graph.calls[0].body, { messaging_product: 'whatsapp', status: 'read', message_id: 'wamid.ABC' });

    graph.scriptReads({ status: 500 }, { status: 200 });
    assert.equal((await client.markRead('wamid.DEF')).ok, false);
    assert.equal(graph.reads.length, 2, 'a failed read receipt is not retried');
    assert.equal(logs.count('graph.mark_read_failed'), 1);
  });
});

describe('retries', () => {
  const retryable = [
    ['HTTP 500', { status: 500, body: { error: { code: 2 } } }],
    ['HTTP 429', { status: 429, body: { error: { code: 130429 } } }],
    ['a network error', new TypeError('fetch failed')],
    ['a timeout', new DOMException('The operation was aborted due to timeout', 'TimeoutError')],
  ];

  for (const [label, failure] of retryable) {
    test(`retries once after ${label}`, async () => {
      const { client, graph } = setup({ script: [failure, { status: 200 }] });
      assert.deepEqual(await client.send(USER, TEXT), { ok: true, status: 200, attempts: 2 });
      assert.equal(graph.sent.length, 2);
    });
  }

  test('gives up after the single retry and reports only status and error codes', async () => {
    const message = `Invalid token ${TOKEN} for ${USER}`;
    const { client, graph, logs } = setup({
      script: [
        { status: 500, body: { error: { message, code: 2, error_subcode: 33 } } },
        { status: 500, body: { error: { message, code: 2, error_subcode: 33 } } },
      ],
    });

    const outcome = await client.send(USER, TEXT);
    assert.deepEqual([outcome.ok, outcome.status, outcome.attempts], [false, 500, 2]);
    assert.equal(graph.sent.length, 2);

    const [failure] = logs.entries().filter((entry) => entry.event === 'graph.send_failed');
    assert.deepEqual([failure.status, failure.code, failure.subcode, failure.attempts], [500, 2, 33, 2]);
    const output = logs.lines.join('\n');
    assert.ok(!output.includes(TOKEN) && !output.includes(USER) && !output.includes('Invalid token'), output);
  });

  test('does not retry client errors such as an expired token', async () => {
    const { client, graph } = setup({ script: [{ status: 400, body: { error: { code: 190 } } }, { status: 200 }] });
    const outcome = await client.send(USER, TEXT);
    assert.deepEqual([outcome.ok, outcome.status, outcome.code], [false, 400, 190]);
    assert.equal(graph.sent.length, 1);
  });
});

describe('interactive list fallback', () => {
  test('re-sends the menu as numbered plain text when WhatsApp rejects the list', async () => {
    const { client, graph, logs } = setup({ script: [{ status: 400, body: { error: { code: 100 } } }, { status: 200 }] });
    const outcome = await client.send(USER, welcome());

    assert.equal(outcome.ok, true);
    assert.deepEqual(graph.sent.map((call) => call.body.type), ['interactive', 'text']);
    assert.match(graph.sent[1].body.text.body, /1\. Explorar y reservar[^]*5\. Hablar con una persona/);
    assert.equal(logs.count('graph.interactive_rejected'), 1);
  });

  test('does not fall back for account-level errors (the text would fail the same way)', async () => {
    const { client, graph } = setup({ script: [{ status: 400, body: { error: { code: 190 } } }] });
    assert.equal((await client.send(USER, welcome())).ok, false);
    assert.equal(graph.sent.length, 1);
  });
});

describe('without credentials', () => {
  for (const missing of ['WHATSAPP_TOKEN', 'WHATSAPP_PHONE_NUMBER_ID']) {
    test(`never calls the Graph API when ${missing} is missing`, async () => {
      const { client, graph } = setup({ env: { [missing]: '' } });
      assert.equal(client.enabled, false);
      assert.deepEqual(await client.send(USER, TEXT), { ok: false, skipped: true, status: 0 });
      assert.equal((await client.markRead('wamid.ABC')).skipped, true);
      assert.equal(graph.calls.length, 0);
    });
  }
});
