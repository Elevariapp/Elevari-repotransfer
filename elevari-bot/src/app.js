'use strict';

const crypto = require('node:crypto');
const express = require('express');
const bodyParser = require('body-parser');

const { loadConfig, secretValues } = require('./config');
const { createLogger, describeError, maskPhone } = require('./logger');
const { verifySignature } = require('./signature');
const { TtlMap, RateLimiter } = require('./store');
const { parseWebhook } = require('./webhook');
const { route } = require('./concierge');
const { createWhatsAppClient } = require('./whatsapp');

const WEBHOOK_PATH = '/webhook/whatsapp';

const DEDUPE_TTL_MS = 10 * 60 * 1000;
const DEDUPE_MAX_ENTRIES = 5000;
const SENDER_STATE_TTL_MS = 24 * 60 * 60 * 1000;
const SENDER_MAX_ENTRIES = 20_000;
const RATE_LIMIT = 15;
const RATE_WINDOW_MS = 60 * 1000;
const LOG_THROTTLE_MS = 60 * 1000;

const NO_BODY = Buffer.alloc(0);

// Compares fixed-length digests so neither the content nor the length of the secret leaks through timing.
function safeEqual(a, b) {
  const digest = (value) => crypto.createHash('sha256').update(value).digest();
  return crypto.timingSafeEqual(digest(a), digest(b));
}

// `fetchImpl` (Graph API), `now` (clock) and `logger` are injectable so tests run offline and deterministically.
function createApp({ config = loadConfig(), fetchImpl = globalThis.fetch, now = Date.now, logger, retryDelayMs } = {}) {
  const log = logger ?? createLogger({ secrets: secretValues(config) });
  const { appSecret, verifyToken, phoneNumberId } = config.whatsapp;
  const client = createWhatsAppClient({ config, fetchImpl, logger: log, retryDelayMs });
  // In production the bot never acts on webhooks it cannot authenticate
  const acceptsEvents = Boolean(appSecret) || !config.isProduction;

  const seenMessages = new TtlMap({ ttlMs: DEDUPE_TTL_MS, maxEntries: DEDUPE_MAX_ENTRIES, now });
  const senders = new TtlMap({ ttlMs: SENDER_STATE_TTL_MS, maxEntries: SENDER_MAX_ENTRIES, now });
  const limiter = new RateLimiter({ limit: RATE_LIMIT, windowMs: RATE_WINDOW_MS, maxKeys: SENDER_MAX_ENTRIES, now });
  const recentLogs = new TtlMap({ ttlMs: LOG_THROTTLE_MS, maxEntries: 100, now });
  const inFlight = new Set();

  // Repeating conditions (every webhook while misconfigured, a scanner hitting the endpoint) log once a minute
  function logThrottled(level, event, fields) {
    if (recentLogs.has(event)) return;
    recentLogs.set(event, true);
    log[level](event, fields);
  }

  if (!appSecret) {
    if (config.isProduction) {
      log.error('config.app_secret_missing', {
        detail: 'WHATSAPP_APP_SECRET is not set: every webhook POST is refused (503) until it is configured',
      });
    } else {
      log.warn('config.signature_verification_disabled', {
        detail: 'WHATSAPP_APP_SECRET is not set: webhook signatures are NOT verified (allowed outside production only)',
      });
    }
  }
  if (!client.enabled) {
    const missing = [
      ['WHATSAPP_TOKEN', config.whatsapp.token],
      ['WHATSAPP_PHONE_NUMBER_ID', phoneNumberId],
    ]
      .filter(([, value]) => !value)
      .map(([name]) => name);
    log.warn('config.replies_disabled', { detail: 'Replies are disabled until these variables are set', missing });
  }
  if (!verifyToken) {
    log.warn('config.verify_token_missing', {
      detail: 'WHATSAPP_VERIFY_TOKEN is not set: Meta webhook verification (GET) will always be refused',
    });
  }

  const rememberSender = (from, state) =>
    senders.set(from, state, state.optedOut ? Infinity : SENDER_STATE_TTL_MS);

  async function processMessage(message) {
    const { id, from } = message;

    if (message.kind === 'ignore') return;
    // One Meta app can be subscribed to several numbers: never answer from the wrong one
    if (message.phoneNumberId && message.phoneNumberId !== phoneNumberId) {
      logThrottled('warn', 'message.other_number_ignored', {});
      return;
    }
    // Dedupe first so Meta redeliveries do not eat the sender's rate-limit budget
    if (id) {
      if (seenMessages.has(id)) return;
      seenMessages.set(id, true);
    }
    const verdict = limiter.hit(from);
    if (!verdict.allowed) {
      if (verdict.first) log.warn('message.rate_limited', { from: maskPhone(from) });
      return;
    }

    const previous = senders.get(from);
    const result = route({
      text: message.text,
      buttonId: message.buttonId,
      type: message.kind === 'unsupported' ? 'unsupported' : 'text',
      now: now(),
      state: previous,
      name: message.profileName,
      siteUrl: config.site.url,
    });
    rememberSender(from, result.state);

    const [reply] = result.replies;
    let delivery;
    if (reply) {
      [delivery] = await Promise.all([client.send(from, reply), client.markRead(id)]);
      // A reply that never reached the user must not start a handoff silence or use up a cooldown.
      // (Opt-outs are always honoured; the check skips writes made meanwhile by a newer message.)
      if (!delivery.ok && !result.state.optedOut && senders.get(from) === result.state) {
        if (previous) rememberSender(from, previous);
        else senders.delete(from);
      }
    }

    log.info('message.handled', {
      from: maskPhone(from),
      type: message.type,
      intent: result.intent,
      replied: delivery?.ok === true,
      status: delivery?.status,
    });
  }

  async function handleInbound(body) {
    if (!client.enabled) {
      logThrottled('warn', 'message.skipped_replies_disabled', {});
      return;
    }
    for (const message of parseWebhook(body)) {
      try {
        await processMessage(message);
      } catch (err) {
        log.error('message.failed', describeError(err));
      }
    }
  }

  function track(task) {
    const tracked = task
      .catch((err) => log.error('webhook.processing_failed', describeError(err)))
      .finally(() => inFlight.delete(tracked));
    inFlight.add(tracked);
  }

  // Resolves once every webhook already acknowledged has been fully processed (shutdown and tests)
  async function idle() {
    while (inFlight.size > 0) await Promise.allSettled([...inFlight]);
  }

  const refuseWithoutSecret = (req, res, next) => {
    if (acceptsEvents) return next();
    logThrottled('error', 'webhook.refused_app_secret_missing', {});
    return res.status(503).json({ error: 'webhook_signature_not_configured' });
  };

  const parseJson = bodyParser.json({
    limit: '1mb',
    // the signature covers the exact bytes Meta sent, not a re-serialisation of the parsed JSON
    verify: (req, res, buf) => {
      req.rawBody = buf;
    },
  });

  const authenticate = (req, res, next) => {
    if (!appSecret) {
      logThrottled('warn', 'webhook.unsigned_accepted', { detail: 'Signature NOT verified (WHATSAPP_APP_SECRET unset)' });
      return next();
    }
    const result = verifySignature({
      secret: appSecret,
      rawBody: req.rawBody ?? NO_BODY,
      header: req.get('x-hub-signature-256'),
    });
    if (!result.ok) {
      logThrottled('warn', 'webhook.signature_rejected', { reason: result.reason });
      return res.status(401).json({ error: 'invalid_signature' });
    }
    return next();
  };

  const app = express();
  app.disable('x-powered-by');
  app.use((req, res, next) => {
    res.set('X-Content-Type-Options', 'nosniff');
    next();
  });

  // Always 200 (Docker healthcheck + deploy verification); only flags, never values
  app.get('/health', (req, res) => {
    res.set('Cache-Control', 'no-store').status(200).json({
      status: 'ok',
      service: 'elevari-bot',
      replies_enabled: client.enabled,
      signature_verification: appSecret ? 'enabled' : 'missing',
      verify_token: verifyToken ? 'configured' : 'missing',
      accepting_events: acceptsEvents,
    });
  });

  // Meta webhook verification handshake
  app.get(WEBHOOK_PATH, (req, res) => {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];
    const reply = (status, text) => res.status(status).type('text/plain').send(text);

    if (typeof mode !== 'string' || typeof token !== 'string' || !mode || !token) return reply(400, 'Bad Request');
    if (mode !== 'subscribe' || !verifyToken || !safeEqual(token, verifyToken)) {
      logThrottled('warn', 'webhook.verification_rejected', {});
      return reply(403, 'Forbidden');
    }
    if (typeof challenge !== 'string' || !challenge) return reply(400, 'Bad Request');

    log.info('webhook.verified');
    return reply(200, challenge);
  });

  // Inbound events. Meta retries anything that is not a fast 200, so acknowledge first and work afterwards.
  app.post(WEBHOOK_PATH, refuseWithoutSecret, parseJson, authenticate, (req, res) => {
    res.status(200).type('text/plain').send('EVENT_RECEIVED');
    track(handleInbound(req.body));
  });

  app.use((req, res) => {
    res.status(404).json({ error: 'not_found' });
  });

  // Express recognises error handlers by their four arguments
  app.use((err, req, res, next) => {
    const status = Number.isInteger(err?.status) && err.status >= 400 && err.status < 500 ? err.status : 500;
    logThrottled(status === 500 ? 'error' : 'warn', 'request.failed', {
      method: req.method,
      status,
      type: typeof err?.type === 'string' ? err.type : undefined,
      ...describeError(err),
    });
    if (res.headersSent) return res.end();
    const label = status === 500 ? 'internal_error' : status === 413 ? 'payload_too_large' : 'bad_request';
    return res.status(status).json({ error: label });
  });

  app.locals.idle = idle;
  return app;
}

module.exports = { createApp, WEBHOOK_PATH };
