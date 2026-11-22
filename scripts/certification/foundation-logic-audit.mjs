/**
 * Phase 0-2 — executable certification of pure/domain logic.
 * Runs the REAL api sources through a test loader (no database, no network).
 * Usage: node --import ./scripts/certification/register.mjs scripts/certification/foundation-logic-audit.mjs
 */
import { createHash } from 'node:crypto';
import { writeFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';

process.env.PAYMENTS_MODE = 'mock';
process.env.PAYMENTS_WOMPI_ENABLED = 'true';
process.env.WOMPI_PUBLIC_KEY = 'pub_test_cert';
process.env.WOMPI_PRIVATE_KEY = 'prv_test_cert';
process.env.WOMPI_EVENTS_SECRET = 'events_secret_cert';
process.env.WOMPI_INTEGRITY_SECRET = 'integrity_secret_cert';

const paymentState = await import('../../api/src/lib/payments/payment-state.ts');
const bookingState = await import('../../api/src/lib/booking-state.ts');
const config = await import('../../api/src/lib/payments/config.ts');
const wompi = await import('../../api/src/lib/payments/wompi-provider.ts');
const fxRate = await import('../../api/src/lib/payments/fx-rate.ts');
const disclosure = await import('../../api/src/lib/payments/disclosure.ts');

const cases = [];
function record(id, fn, expected) {
  let actual;
  let error = null;
  try {
    actual = fn();
  } catch (err) {
    error = err instanceof Error ? err.message : String(err);
  }
  const pass = error === null && JSON.stringify(actual) === JSON.stringify(expected);
  cases.push({ id, status: pass ? 'PASS' : 'FAIL', expected, actual: actual ?? null, error });
}

function recordThrows(id, fn, matcher) {
  let error = null;
  try {
    fn();
  } catch (err) {
    error = err instanceof Error ? err.message : String(err);
  }
  const pass = Boolean(error) && (!matcher || error.includes(matcher));
  cases.push({ id, status: pass ? 'PASS' : 'FAIL', expected: `throws ${matcher ?? ''}`.trim(), actual: error });
}

// ——— A. Payment state machine ———
const P = (from, to) => paymentState.canTransitionPayment(from, to);
record('payment.pending->processing', () => P('pending', 'processing'), true);
record('payment.pending->succeeded', () => P('pending', 'succeeded'), true);
record('payment.pending->failed', () => P('pending', 'failed'), true);
record('payment.processing->succeeded', () => P('processing', 'succeeded'), true);
record('payment.succeeded->partially_refunded', () => P('succeeded', 'partially_refunded'), true);
record('payment.partially_refunded->refunded', () => P('partially_refunded', 'refunded'), true);
record('payment.failed->succeeded (blocked)', () => P('failed', 'succeeded'), false);
record('payment.refunded->succeeded (blocked)', () => P('refunded', 'succeeded'), false);
record('payment.succeeded->pending (blocked)', () => P('succeeded', 'pending'), false);
record('payment.terminal.failed', () => paymentState.isTerminalPayment('failed'), true);
record('payment.terminal.refunded', () => paymentState.isTerminalPayment('refunded'), true);
record('payment.paid.succeeded', () => paymentState.isPaidStatus('succeeded'), true);
record('payment.paid.failed', () => paymentState.isPaidStatus('failed'), false);
record('payment.idempotent.noop', () => {
  paymentState.assertPaymentTransition('succeeded', 'succeeded');
  return 'no-throw';
}, 'no-throw');
recordThrows('payment.invalid.throws', () => paymentState.assertPaymentTransition('failed', 'succeeded'), 'Invalid payment transition');

// ——— B. Booking state machine ———
const B = (from, to) => bookingState.canTransition(from, to);
record('booking.draft->pending_payment', () => B('draft', 'pending_payment'), true);
record('booking.pending_payment->confirmed', () => B('pending_payment', 'confirmed'), true);
record('booking.confirmed->checked_in', () => B('confirmed', 'checked_in'), true);
record('booking.checked_in->completed', () => B('checked_in', 'completed'), true);
record('booking.confirmed->completed (blocked)', () => B('confirmed', 'completed'), false);
record('booking.completed->confirmed (blocked)', () => B('completed', 'confirmed'), false);
record('booking.cancelled->confirmed (blocked)', () => B('cancelled', 'confirmed'), false);
recordThrows('booking.invalid.throws', () => bookingState.assertTransition('completed', 'confirmed'), 'Invalid booking transition');

// ——— C. Wompi configuration guards ———
record('config.sandbox.derived', () => {
  const cfg = config.getPaymentsConfig();
  return { env: cfg.wompi?.env, mode: cfg.mode, wompiEnabled: cfg.wompiEnabled };
}, { env: 'sandbox', mode: 'mock', wompiEnabled: true });

recordThrows('config.mixed_keys.blocked', () => {
  process.env.WOMPI_PRIVATE_KEY = 'prv_prod_cert';
  config.resetPaymentsConfigCache();
  config.getPaymentsConfig();
}, 'different environments');
process.env.WOMPI_PRIVATE_KEY = 'prv_test_cert';

recordThrows('config.missing_secret.blocked', () => {
  delete process.env.WOMPI_EVENTS_SECRET;
  config.resetPaymentsConfigCache();
  config.getPaymentsConfig();
}, 'missing configuration');
process.env.WOMPI_EVENTS_SECRET = 'events_secret_cert';

recordThrows('config.bad_prefix.blocked', () => {
  process.env.WOMPI_PUBLIC_KEY = 'pk_live_wrong';
  config.resetPaymentsConfigCache();
  config.getPaymentsConfig();
}, 'pub_prod_ or pub_test_');
process.env.WOMPI_PUBLIC_KEY = 'pub_test_cert';
config.resetPaymentsConfigCache();

// ——— D. Webhook signature (real SHA-256 verification) ———
const SECRET = 'events_secret_cert';
const tx = { id: 'tx_cert_1', status: 'APPROVED', reference: 'pay_cert_1', amount_in_cents: 150000, currency: 'COP' };
const props = ['transaction.id', 'transaction.status', 'transaction.amount_in_cents', 'transaction.currency'];
const timestamp = 1763000000;
const concat = props.map((p) => String(tx[p.replace(/^transaction\./, '')])).join('');
const checksum = createHash('sha256').update(`${concat}${timestamp}${SECRET}`, 'utf8').digest('hex');
const validPayload = {
  event: 'transaction.updated',
  data: { transaction: { ...tx } },
  signature: { properties: props, checksum },
  timestamp,
};

record('webhook.valid_signature', () => wompi.verifyWompiWebhook(validPayload), true);
record('webhook.tampered_amount', () => {
  const tampered = { ...validPayload, data: { transaction: { ...tx, amount_in_cents: 1 } } };
  return wompi.verifyWompiWebhook(tampered);
}, false);
record('webhook.tampered_status', () => {
  const tampered = { ...validPayload, data: { transaction: { ...tx, status: 'DECLINED' } } };
  return wompi.verifyWompiWebhook(tampered);
}, false);
record('webhook.wrong_secret', () => {
  process.env.WOMPI_EVENTS_SECRET = 'other_secret';
  config.resetPaymentsConfigCache();
  const result = wompi.verifyWompiWebhook(validPayload);
  process.env.WOMPI_EVENTS_SECRET = SECRET;
  config.resetPaymentsConfigCache();
  return result;
}, false);
record('webhook.missing_properties', () => wompi.verifyWompiWebhook({ ...validPayload, signature: { properties: undefined, checksum } }), false);
record('webhook.missing_timestamp', () => wompi.verifyWompiWebhook({ ...validPayload, timestamp: undefined }), false);

// Unsigned webhooks must be rejected when Wompi is not configured.
record('webhook.unsigned.rejected_by_default', () => {
  delete process.env.ALLOW_UNSIGNED_WEBHOOKS;
  process.env.PAYMENTS_WOMPI_ENABLED = 'false';
  config.resetPaymentsConfigCache();
  const result = wompi.verifyWompiWebhook(validPayload);
  process.env.PAYMENTS_WOMPI_ENABLED = 'true';
  config.resetPaymentsConfigCache();
  return result;
}, false);
record('webhook.unsigned.explicit_optin', () => {
  process.env.ALLOW_UNSIGNED_WEBHOOKS = 'true';
  process.env.PAYMENTS_WOMPI_ENABLED = 'false';
  config.resetPaymentsConfigCache();
  const result = wompi.verifyWompiWebhook(validPayload);
  delete process.env.ALLOW_UNSIGNED_WEBHOOKS;
  process.env.PAYMENTS_WOMPI_ENABLED = 'true';
  config.resetPaymentsConfigCache();
  return result;
}, true);

// ——— E. Refund safety guard ———
const partial = await wompi.refundWompiPayment({ transactionId: 'tx_cert_1', amountMinor: 5000, fullAmountMinor: 10000 });
cases.push({
  id: 'refund.partial.pending_manual',
  status: partial.refunded === false && partial.pendingManual === true && /Partial refunds/.test(partial.reason ?? '') ? 'PASS' : 'FAIL',
  expected: { refunded: false, pendingManual: true, reason: 'Partial refunds...' },
  actual: partial,
});

// ——— F. FX helpers ———
delete process.env.FX_COP_USD_RATE;
record('fx.default_rate', () => fxRate.getCopUsdRate().copPerUsd, 4000);
record('fx.env_rate', () => {
  process.env.FX_COP_USD_RATE = '4150';
  return fxRate.getCopUsdRate().copPerUsd;
}, 4150);
recordThrows('fx.invalid_rate.blocked', () => {
  process.env.FX_COP_USD_RATE = '0';
  fxRate.getCopUsdRate();
}, 'positive number');
delete process.env.FX_COP_USD_RATE;
record('fx.default_ttl', () => fxRate.quoteTtlMinutes(), 15);
record('fx.env_ttl', () => {
  process.env.FX_QUOTE_TTL_MINUTES = '30';
  return fxRate.quoteTtlMinutes();
}, 30);
record('fx.invalid_ttl.fallback', () => {
  process.env.FX_QUOTE_TTL_MINUTES = '-5';
  return fxRate.quoteTtlMinutes();
}, 15);
delete process.env.FX_QUOTE_TTL_MINUTES;

// ——— G. Disclosure hashing ———
const input = {
  chargeAmountMinor: 1552500,
  chargeCurrency: 'COP',
  displayAmountMinor: 38750,
  displayCurrency: 'USD',
  rate: 4000,
  lockedAt: new Date('2026-11-13T10:00:00.000Z'),
  expiresAt: new Date('2026-11-13T10:15:00.000Z'),
};
const esText = disclosure.buildDisclosureText(input, 'es');
const enText = disclosure.buildDisclosureText(input, 'en');
record('disclosure.es.contains_charge', () => esText.includes('15525.00 COP'), true);
record('disclosure.es.contains_refund_rule', () => /reembolsos se emiten en COP/i.test(esText), true);
record('disclosure.en.contains_reference', () => /reference only/i.test(enText), true);
record('disclosure.hash.deterministic', () => disclosure.hashDisclosure(esText) === disclosure.hashDisclosure(esText), true);
record('disclosure.hash.locale_sensitive', () => disclosure.hashDisclosure(esText) !== disclosure.hashDisclosure(enText), true);
record('disclosure.hash.sha256_length', () => disclosure.hashDisclosure(esText).length, 64);
record('disclosure.locale.default', () => disclosure.normalizeLocale(undefined), 'es');
record('disclosure.locale.en', () => disclosure.normalizeLocale('en'), 'en');

// ——— Report ———
const report = {
  generatedAt: new Date().toISOString(),
  suites: ['payment-state', 'booking-state', 'wompi-config', 'webhook-signature', 'refund-guard', 'fx', 'disclosure'],
  cases,
  summary: {
    total: cases.length,
    pass: cases.filter((c) => c.status === 'PASS').length,
    fail: cases.filter((c) => c.status === 'FAIL').length,
  },
};
const outDir = join(process.cwd(), 'docs', 'reports', 'assets');
await mkdir(outDir, { recursive: true });
await writeFile(join(outDir, 'foundation-logic-results.json'), JSON.stringify(report, null, 2));

for (const c of cases) {
  console.log(`${c.status} ${c.id}${c.status === 'FAIL' ? ' :: expected=' + JSON.stringify(c.expected) + ' actual=' + JSON.stringify(c.actual) + ' error=' + c.error : ''}`);
}
console.log(`summary: ${report.summary.pass}/${report.summary.total} pass`);

