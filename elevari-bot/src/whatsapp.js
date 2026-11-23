'use strict';

const { describeError } = require('./logger');

const GRAPH_ORIGIN = 'https://graph.facebook.com';
const REQUEST_TIMEOUT_MS = 10_000;
const DEFAULT_RETRY_DELAY_MS = 500;
// Graph error codes meaning "the request body was rejected" (as opposed to a bad token or account issue)
const PAYLOAD_REJECTED_CODES = new Set([100, 131008, 131009]);

const NOOP_LOGGER = { info() {}, warn() {}, error() {} };
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Turns a concierge reply ({ type: 'text' | 'list', ... }) into a Graph API /messages request body.
function buildPayload(to, reply) {
  const base = { messaging_product: 'whatsapp', recipient_type: 'individual', to };

  if (reply.type === 'list') {
    return {
      ...base,
      type: 'interactive',
      interactive: {
        type: 'list',
        body: { text: reply.body },
        footer: { text: reply.footer },
        action: {
          button: reply.button,
          sections: [{ title: reply.sectionTitle, rows: reply.rows.map(({ id, title }) => ({ id, title })) }],
        },
      },
    };
  }

  return { ...base, type: 'text', text: { preview_url: true, body: reply.body } };
}

// Only Graph's numeric error codes are kept: the message text can echo request content.
function parseGraphError(text) {
  try {
    const error = JSON.parse(text)?.error;
    return {
      code: Number.isInteger(error?.code) ? error.code : undefined,
      subcode: Number.isInteger(error?.error_subcode) ? error.error_subcode : undefined,
    };
  } catch {
    return {};
  }
}

const shouldRetry = (outcome) =>
  !outcome.ok && (outcome.status === 0 || outcome.status === 429 || outcome.status >= 500);

const isPayloadRejection = (outcome) =>
  outcome.status === 400 && (outcome.code === undefined || PAYLOAD_REJECTED_CODES.has(outcome.code));

// Sends WhatsApp messages through the Graph API. Nothing here throws: every call resolves to an
// outcome ({ ok, status, ... }) so a Graph outage can never break webhook handling. Logs carry
// HTTP statuses and Graph error codes only, never the token, recipients or message content.
function createWhatsAppClient({
  config,
  fetchImpl = globalThis.fetch,
  logger = NOOP_LOGGER,
  retryDelayMs = DEFAULT_RETRY_DELAY_MS,
}) {
  const { token, phoneNumberId, graphApiVersion } = config.whatsapp;
  const enabled = Boolean(token && phoneNumberId && typeof fetchImpl === 'function');
  const endpoint = `${GRAPH_ORIGIN}/${graphApiVersion}/${encodeURIComponent(phoneNumberId)}/messages`;

  async function attempt(payload) {
    try {
      const response = await fetchImpl(endpoint, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      });
      // always consume the body so the connection can be reused
      const text = await response.text().catch(() => '');
      return response.ok
        ? { ok: true, status: response.status }
        : { ok: false, status: response.status, ...parseGraphError(text) };
    } catch (err) {
      return { ok: false, status: 0, ...describeError(err) };
    }
  }

  // One retry with a short jittered backoff on network errors, 429 and 5xx.
  async function post(payload, { retries }) {
    let outcome = await attempt(payload);
    outcome.attempts = 1;
    for (let retry = 1; retry <= retries && shouldRetry(outcome); retry += 1) {
      if (retryDelayMs > 0) await wait(retryDelayMs + Math.floor(Math.random() * (retryDelayMs / 2)));
      outcome = await attempt(payload);
      outcome.attempts = retry + 1;
    }
    return outcome;
  }

  async function send(to, reply) {
    if (!enabled) return { ok: false, skipped: true, status: 0 };

    let outcome = await post(buildPayload(to, reply), { retries: 1 });

    // If WhatsApp rejects the interactive list, still answer with the same menu as plain text
    if (!outcome.ok && reply.type === 'list' && isPayloadRejection(outcome)) {
      logger.warn('graph.interactive_rejected', { status: outcome.status, code: outcome.code, subcode: outcome.subcode });
      outcome = await post(buildPayload(to, { type: 'text', body: reply.fallbackText ?? reply.body }), { retries: 1 });
    }

    if (!outcome.ok) {
      logger.warn('graph.send_failed', {
        status: outcome.status,
        code: outcome.code,
        subcode: outcome.subcode,
        error: outcome.error,
        attempts: outcome.attempts,
      });
    }
    return outcome;
  }

  // Best effort (blue ticks): a single attempt, failures are only logged at warn level.
  async function markRead(messageId) {
    if (!enabled || !messageId) return { ok: false, skipped: true, status: 0 };
    const outcome = await post({ messaging_product: 'whatsapp', status: 'read', message_id: messageId }, { retries: 0 });
    if (!outcome.ok) logger.warn('graph.mark_read_failed', { status: outcome.status, code: outcome.code });
    return outcome;
  }

  return { enabled, send, markRead };
}

module.exports = { createWhatsAppClient, buildPayload, GRAPH_ORIGIN, REQUEST_TIMEOUT_MS };
