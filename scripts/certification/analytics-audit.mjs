/**
 * Phase 3.5 — analytics payload certification.
 * Runs lib/analytics.ts with a stubbed window and asserts event names,
 * GA4/Meta mappings, payload integrity and no-op behaviour without keys.
 * Usage: node scripts/certification/analytics-audit.mjs
 */
import { writeFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';

process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID = 'G-CERTTEST';
process.env.NEXT_PUBLIC_META_PIXEL_ID = 'PIXEL-CERTTEST';

const calls = [];
globalThis.window = {
  gtag: (...args) => calls.push({ dest: 'ga4', name: args[1], params: args[2] ?? {} }),
  fbq: (...args) => calls.push({ dest: 'meta', name: args[1], params: args[2] ?? {} }),
};

const { analytics } = await import('../../lib/analytics.ts');

const cases = [];
function run(id, fn, expectations) {
  const before = calls.length;
  fn();
  const emitted = calls.slice(before);
  const failures = [];

  for (const exp of expectations) {
    const match = emitted.find((c) => c.dest === exp.dest && c.name === exp.name);
    if (!match) failures.push(`missing ${exp.dest}:${exp.name}`);
    else {
      for (const key of exp.required ?? []) {
        if (match.params[key] === undefined) failures.push(`${exp.dest}:${exp.name} missing param ${key}`);
      }
      for (const [key, value] of Object.entries(exp.equals ?? {})) {
        if (match.params[key] !== value) failures.push(`${exp.dest}:${exp.name} ${key}=${match.params[key]} != ${value}`);
      }
    }
  }

  const primitiveOk = emitted.every((c) =>
    Object.values(c.params).every((v) => ['string', 'number', 'boolean', 'undefined'].includes(typeof v)),
  );
  if (!primitiveOk) failures.push('non-primitive payload value');

  cases.push({ id, emitted, failures, status: failures.length === 0 ? 'PASS' : 'FAIL' });
}

run('view_property', () => analytics.viewProperty({ id: 'p1', slug: 'domo-1', title: 'Domo', price: 450000 }), [
  { dest: 'ga4', name: 'view_property', required: ['item_id', 'item_slug', 'item_name', 'value', 'currency'], equals: { currency: 'COP' } },
  { dest: 'ga4', name: 'view_item', required: ['item_id', 'value'] },
  { dest: 'meta', name: 'ViewContent' },
]);

run('select_dates', () => analytics.selectDates({ propertyId: 'p1', checkIn: '2026-07-01', checkOut: '2026-07-04', nights: 3 }), [
  { dest: 'ga4', name: 'select_dates', required: ['property_id', 'check_in', 'check_out', 'nights'], equals: { nights: 3 } },
]);

run('view_quote', () => analytics.viewQuote({ propertyId: 'p1', nights: 3, total: 1552500, available: true }), [
  { dest: 'ga4', name: 'view_quote', required: ['property_id', 'nights', 'value', 'available'], equals: { value: 1552500, available: true } },
]);

run('start_checkout', () => analytics.startCheckout('b1', 1552500), [
  { dest: 'ga4', name: 'start_checkout', required: ['transaction_id', 'value', 'currency'] },
  { dest: 'ga4', name: 'begin_checkout', required: ['transaction_id'] },
  { dest: 'meta', name: 'InitiateCheckout' },
]);

run('payment_started', () => analytics.paymentStarted({ bookingId: 'b1', value: 1552500, provider: 'wompi', mode: 'mock' }), [
  { dest: 'ga4', name: 'payment_started', required: ['transaction_id', 'value', 'payment_provider', 'payment_mode'] },
  { dest: 'ga4', name: 'add_payment_info' },
  { dest: 'meta', name: 'AddPaymentInfo' },
]);

run('payment_completed', () => analytics.paymentCompleted('b1', 1552500), [
  { dest: 'ga4', name: 'payment_completed', required: ['transaction_id', 'value'] },
  { dest: 'ga4', name: 'purchase' },
  { dest: 'meta', name: 'Purchase' },
]);

run('booking_confirmed', () => analytics.bookingConfirmed('b1', 1552500), [
  { dest: 'ga4', name: 'booking_confirmed', required: ['transaction_id', 'value'] },
  { dest: 'ga4', name: 'purchase' },
]);

run('checkout_abandoned', () => analytics.checkoutAbandoned({ bookingId: 'b1', value: 1552500, reason: 'navigate_away' }), [
  { dest: 'ga4', name: 'checkout_abandoned', required: ['transaction_id', 'value', 'reason'], equals: { reason: 'navigate_away' } },
]);

// No-op without keys
const callsWithoutKeys = [];
globalThis.window = {
  gtag: (...args) => callsWithoutKeys.push(args),
  fbq: (...args) => callsWithoutKeys.push(args),
};
delete process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
delete process.env.NEXT_PUBLIC_META_PIXEL_ID;
analytics.viewProperty({ id: 'p1', slug: 's', title: 't', price: 1 });
cases.push({
  id: 'no_op_without_keys',
  status: callsWithoutKeys.length === 0 ? 'PASS' : 'FAIL',
  failures: callsWithoutKeys.length === 0 ? [] : ['events emitted without keys'],
  emitted: [],
});

const report = {
  generatedAt: new Date().toISOString(),
  source: 'lib/analytics.ts',
  cases,
  summary: {
    total: cases.length,
    pass: cases.filter((c) => c.status === 'PASS').length,
    fail: cases.filter((c) => c.status === 'FAIL').length,
  },
};
const outDir = join(process.cwd(), 'docs', 'reports', 'assets');
await mkdir(outDir, { recursive: true });
await writeFile(join(outDir, 'analytics-results.json'), JSON.stringify(report, null, 2));

for (const c of cases) {
  console.log(`${c.status} ${c.id}${c.failures.length ? ' :: ' + c.failures.join('; ') : ''}`);
}
console.log(`summary: ${report.summary.pass}/${report.summary.total} pass`);
process.exitCode = report.summary.fail === 0 ? 0 : 1;
