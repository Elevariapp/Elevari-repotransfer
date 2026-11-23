'use strict';

const crypto = require('node:crypto');

const HEADER_PATTERN = /^sha256=([0-9a-f]{64})$/i;

function computeSignature(secret, rawBody) {
  return `sha256=${crypto.createHmac('sha256', secret).update(rawBody).digest('hex')}`;
}

// Validates Meta's X-Hub-Signature-256 header ("sha256=<hex>") against the HMAC-SHA256 of the
// exact bytes received. Returns { ok, reason } so callers can log why without logging values.
function verifySignature({ secret, rawBody, header }) {
  if (typeof header !== 'string' || header.trim() === '') return { ok: false, reason: 'missing' };
  const match = HEADER_PATTERN.exec(header.trim());
  if (!match) return { ok: false, reason: 'malformed' };

  const provided = Buffer.from(match[1], 'hex');
  const expected = crypto.createHmac('sha256', secret).update(rawBody).digest();
  if (provided.length !== expected.length) return { ok: false, reason: 'malformed' };

  return crypto.timingSafeEqual(provided, expected) ? { ok: true } : { ok: false, reason: 'mismatch' };
}

module.exports = { computeSignature, verifySignature };
