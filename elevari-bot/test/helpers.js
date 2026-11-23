'use strict';

// Shared test utilities. Nothing here touches the network: the Graph API is a fake `fetch`,
// time is a fake clock and the bot runs on an ephemeral localhost port.

const crypto = require('node:crypto');
const http = require('node:http');

const { createApp } = require('../src/app');
const { loadConfig, secretValues } = require('../src/config');
const { createLogger } = require('../src/logger');

const PHONE_NUMBER_ID = '100200300';
const APP_SECRET = 'test-app-secret-placeholder';
const TOKEN = 'test-token-placeholder';
const VERIFY_TOKEN = 'test-verify-token-placeholder';
const SITE = 'https://example.test';
const USER = '573001234567';

const ENV = {
  NODE_ENV: 'test',
  WHATSAPP_TOKEN: TOKEN,
  WHATSAPP_PHONE_NUMBER_ID: PHONE_NUMBER_ID,
  WHATSAPP_VERIFY_TOKEN: VERIFY_TOKEN,
  WHATSAPP_APP_SECRET: APP_SECRET,
  PUBLIC_SITE_URL: SITE,
};

const MINUTE = 60 * 1000;
const HOUR = 60 * MINUTE;

// Independent of src/signature.js on purpose: the tests must not trust the code under test
const sign = (body, secret = APP_SECRET) => `sha256=${crypto.createHmac('sha256', secret).update(body).digest('hex')}`;

function createClock(start = Date.parse('2025-01-15T15:00:00Z')) {
  let current = start;
  return {
    now: () => current,
    advance(ms) {
      current += ms;
    },
  };
}

function deferred() {
  let resolve;
  const promise = new Promise((done) => {
    resolve = done;
  });
  return { promise, resolve };
}

// Fake `fetch` for the Graph API. Records every request. `script()` queues responses (or errors) for
// outgoing messages and `scriptReads()` for mark-as-read calls; anything not scripted succeeds.
function createFakeGraph() {
  const calls = [];
  const scriptedMessages = [];
  const scriptedReads = [];
  let gate = null;

  const fetchImpl = async (url, init) => {
    const call = { url, method: init.method, headers: init.headers, signal: init.signal, body: JSON.parse(init.body) };
    calls.push(call);
    if (gate) await gate;

    const next = (call.body.type !== undefined ? scriptedMessages : scriptedReads).shift();
    if (next instanceof Error) throw next;
    const { status = 200, body = { messaging_product: 'whatsapp', messages: [{ id: 'wamid.FAKE' }] } } = next ?? {};
    return new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });
  };

  return {
    fetchImpl,
    calls,
    get sent() {
      return calls.filter((call) => call.body.type !== undefined);
    },
    get reads() {
      return calls.filter((call) => call.body.status === 'read');
    },
    script: (...responses) => scriptedMessages.push(...responses),
    scriptReads: (...responses) => scriptedReads.push(...responses),
    hold(promise) {
      gate = promise;
    },
  };
}

function createLogCapture() {
  const lines = [];
  const push = (line) => lines.push(line);
  return {
    lines,
    sink: { log: push, warn: push, error: push },
    entries: () => lines.map((line) => JSON.parse(line)),
    events: () => lines.map((line) => JSON.parse(line).event),
    count: (event) => lines.filter((line) => JSON.parse(line).event === event).length,
  };
}

const textOf = (payload) => payload.text?.body ?? payload.interactive?.body?.text;

// --- Cloud API webhook payload builders ---------------------------------------------------------

let sequence = 0;
const nextId = () => `wamid.TEST${(sequence += 1)}`;
const envelope = (from, id) => ({ from, id: id ?? nextId(), timestamp: '1736953200' });

const textMessage = ({ body, from = USER, id }) => ({ ...envelope(from, id), type: 'text', text: { body } });
const listReply = ({ rowId, title, from = USER, id }) => ({
  ...envelope(from, id),
  type: 'interactive',
  interactive: { type: 'list_reply', list_reply: { id: rowId, title } },
});
const buttonReply = ({ buttonId, title, from = USER, id }) => ({
  ...envelope(from, id),
  type: 'interactive',
  interactive: { type: 'button_reply', button_reply: { id: buttonId, title } },
});
const templateButton = ({ payload, text, from = USER, id }) => ({
  ...envelope(from, id),
  type: 'button',
  button: { payload, text },
});
const mediaMessage = ({ type, from = USER, id }) => ({
  ...envelope(from, id),
  type,
  [type]: { id: 'MEDIA_ID', mime_type: 'application/octet-stream' },
});

function webhookPayload(messages = [], { name = 'Camila Pérez', phoneNumberId = PHONE_NUMBER_ID, statuses } = {}) {
  const senders = [...new Set(messages.map((message) => message.from))];
  const value = {
    messaging_product: 'whatsapp',
    metadata: { display_phone_number: '573232688534', phone_number_id: phoneNumberId },
  };
  if (messages.length > 0) {
    value.contacts = senders.map((wa_id) => ({ profile: { name }, wa_id }));
    value.messages = messages;
  }
  if (statuses) value.statuses = statuses;
  return { object: 'whatsapp_business_account', entry: [{ id: 'WABA_ID', changes: [{ field: 'messages', value }] }] };
}

// --- Running bot --------------------------------------------------------------------------------

// Minimal HTTP client (no keep-alive, so nothing lingers after a test)
function httpRequest({ port, method, path, headers = {}, body }) {
  return new Promise((resolve, reject) => {
    const req = http.request({ host: '127.0.0.1', port, path, method, headers, agent: false }, (res) => {
      const chunks = [];
      res.on('data', (chunk) => chunks.push(chunk));
      res.on('end', () => {
        const text = Buffer.concat(chunks).toString('utf8');
        resolve({ status: res.statusCode, headers: res.headers, text, json: () => JSON.parse(text) });
      });
    });
    req.on('error', reject);
    if (body !== undefined) req.write(body);
    req.end();
  });
}

// Starts the real Express app on an ephemeral port. `t` (a node:test context) registers cleanup.
// With `consoleLogs` the app keeps its default logger (console) so tests can capture console output.
async function startBot(t, { env = {}, graph = createFakeGraph(), clock = createClock(), consoleLogs = false } = {}) {
  const config = loadConfig({ ...ENV, ...env });
  const logs = createLogCapture();
  const logger = consoleLogs ? undefined : createLogger({ secrets: secretValues(config), sink: logs.sink });
  const app = createApp({ config, fetchImpl: graph.fetchImpl, now: clock.now, logger, retryDelayMs: 0 });

  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const { port } = server.address();
  t.after(
    () =>
      new Promise((resolve) => {
        server.close(resolve);
        server.closeAllConnections(); // a failing test must not leave a pending request holding the process open
      }),
  );

  const request = (method, path, { headers = {}, body } = {}) => httpRequest({ port, method, path, headers, body });

  // `signature: null` omits the header; `raw` posts exact bytes instead of JSON.stringify(payload)
  const postWebhook = (payload, { secret = APP_SECRET, signature, raw, headers = {} } = {}) => {
    const body = raw ?? JSON.stringify(payload);
    const header = signature === undefined ? sign(body, secret) : signature;
    return request('POST', '/webhook/whatsapp', {
      headers: {
        'content-type': 'application/json',
        'content-length': Buffer.byteLength(body),
        ...(header === null ? {} : { 'x-hub-signature-256': header }),
        ...headers,
      },
      body,
    });
  };

  const idle = () => app.locals.idle();

  // One signed inbound text message, resolved once the bot has finished handling it
  const say = async (body, { from = USER, id, name } = {}) => {
    const res = await postWebhook(webhookPayload([textMessage({ body, from, id })], { name }));
    await idle();
    return res;
  };

  const verify = (query) => request('GET', `/webhook/whatsapp?${new URLSearchParams(query)}`);

  return {
    app,
    config,
    graph,
    clock,
    logs,
    request,
    postWebhook,
    say,
    verify,
    idle,
    health: () => request('GET', '/health'),
    outbox: () => graph.sent.map((call) => call.body),
    texts: () => graph.sent.map((call) => textOf(call.body)),
  };
}

module.exports = {
  PHONE_NUMBER_ID,
  APP_SECRET,
  TOKEN,
  VERIFY_TOKEN,
  SITE,
  USER,
  ENV,
  MINUTE,
  HOUR,
  sign,
  createClock,
  deferred,
  createFakeGraph,
  createLogCapture,
  textOf,
  textMessage,
  listReply,
  buttonReply,
  templateButton,
  mediaMessage,
  webhookPayload,
  httpRequest,
  startBot,
};
