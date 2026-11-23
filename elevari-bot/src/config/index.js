'use strict';

const DEFAULT_SITE_URL = 'https://elevari.live';
const DEFAULT_GRAPH_API_VERSION = 'v21.0';
const DEFAULT_PORT = 3001;
const SUPPORT_EMAIL = 'reserve@elevari.live';

const clean = (value) => (typeof value === 'string' ? value.trim() : '');

function parsePort(value) {
  const port = Number(clean(value));
  return Number.isInteger(port) && port > 0 && port < 65536 ? port : DEFAULT_PORT;
}

function parseSiteUrl(value) {
  const raw = clean(value);
  if (!raw) return DEFAULT_SITE_URL;
  try {
    const { protocol } = new URL(raw);
    if (protocol !== 'https:' && protocol !== 'http:') return DEFAULT_SITE_URL;
  } catch {
    return DEFAULT_SITE_URL;
  }
  return raw.replace(/\/+$/, '');
}

function parseGraphApiVersion(value) {
  const version = clean(value);
  return /^v\d+\.\d+$/.test(version) ? version : DEFAULT_GRAPH_API_VERSION;
}

// Never throws and never requires a variable: the bot must boot with an empty environment
// (CI smoke test) and report what is missing through /health instead.
function loadConfig(env = process.env) {
  return {
    isProduction: clean(env.NODE_ENV).toLowerCase() === 'production',
    whatsapp: {
      phoneNumber: '+57 3232688534',
      token: clean(env.WHATSAPP_TOKEN),
      phoneNumberId: clean(env.WHATSAPP_PHONE_NUMBER_ID),
      businessAccountId: clean(env.WHATSAPP_BUSINESS_ACCOUNT_ID),
      verifyToken: clean(env.WHATSAPP_VERIFY_TOKEN),
      appSecret: clean(env.WHATSAPP_APP_SECRET),
      graphApiVersion: parseGraphApiVersion(env.GRAPH_API_VERSION),
      webhookEndpoint: '/webhook/whatsapp',
    },
    site: {
      url: parseSiteUrl(env.PUBLIC_SITE_URL),
      supportEmail: SUPPORT_EMAIL,
    },
    server: {
      port: parsePort(env.PORT),
      host: clean(env.HOST) || '0.0.0.0',
    },
  };
}

function secretValues(config) {
  const { token, appSecret, verifyToken } = config.whatsapp;
  return [token, appSecret, verifyToken].filter(Boolean);
}

module.exports = { loadConfig, secretValues, DEFAULT_SITE_URL, SUPPORT_EMAIL };