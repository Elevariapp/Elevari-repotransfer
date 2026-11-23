'use strict';

const REDACTED = '[redacted]';
const SENSITIVE_KEY = /^(text|body|token|authorization|secret|password|app_?secret|access_token|signature)$/i;
const MAX_DEPTH = 3;

// "573001234567" -> "***4567". Phone numbers must never reach the logs in full.
function maskPhone(value) {
  const digits = String(value ?? '').replace(/\D/g, '');
  return digits.length >= 4 ? `***${digits.slice(-4)}` : '***';
}

// Error messages can embed user input (e.g. JSON parse snippets), so only the error
// name/code and the first stack frames (file paths only) are logged.
function describeError(err) {
  const e = err && typeof err === 'object' ? err : {};
  const frames =
    typeof e.stack === 'string'
      ? e.stack
          .split('\n')
          .map((line) => line.trim())
          .filter((line) => line.startsWith('at '))
          .slice(0, 3)
      : [];
  return {
    error: typeof e.name === 'string' ? e.name : typeof err,
    code: e.code ?? e.cause?.code,
    at: frames,
  };
}

// One JSON object per line. Last line of defence: configured secrets, bearer tokens,
// signatures and long digit runs (phone numbers) are scrubbed from every logged string.
function createLogger({ secrets = [], sink = console, clock = () => new Date() } = {}) {
  const needles = secrets.filter((secret) => typeof secret === 'string' && secret.length >= 6);

  const redactString = (value) => {
    let out = value;
    for (const needle of needles) out = out.split(needle).join(REDACTED);
    return out
      .replace(/\bBearer\s+[\w.~+/=-]+/gi, `Bearer ${REDACTED}`)
      .replace(/sha256=[0-9a-f]{16,}/gi, `sha256=${REDACTED}`)
      .replace(/\d{7,}/g, (digits) => `***${digits.slice(-4)}`);
  };

  const redact = (value, depth = 0) => {
    if (typeof value === 'string') return redactString(value);
    if (depth >= MAX_DEPTH) return value !== null && typeof value === 'object' ? REDACTED : value;
    if (Array.isArray(value)) return value.map((item) => redact(item, depth + 1));
    if (value !== null && typeof value === 'object') {
      return Object.fromEntries(
        Object.entries(value).map(([key, item]) => [key, SENSITIVE_KEY.test(key) ? REDACTED : redact(item, depth + 1)]),
      );
    }
    return value;
  };

  const writer = (level, method) => (event, fields = {}) => {
    try {
      sink[method](JSON.stringify({ time: clock().toISOString(), level, event, ...redact(fields) }));
    } catch {
      // logging must never take the process down
    }
  };

  return {
    info: writer('info', 'log'),
    warn: writer('warn', 'warn'),
    error: writer('error', 'error'),
  };
}

module.exports = { createLogger, describeError, maskPhone };
