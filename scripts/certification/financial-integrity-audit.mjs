/**
 * Wave 2 — financial integrity certification (pure logic).
 * Covers reconciliation cases A–F, report aggregation, missing payments and the
 * audit-trail completeness rules.
 *
 * Usage: node --import ./scripts/certification/register.mjs scripts/certification/financial-integrity-audit.mjs
 */
import { writeFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import {
  reconcilePayment,
  buildReconciliationReport,
  findMissingPayments,
  expectedAmountMinor,
  expectedCurrency,
} from '../../api/src/lib/reconciliation.ts';
import { buildTransactionTimeline } from '../../api/src/lib/audit-trail.ts';

const cases = [];
function check(id, fn, expected) {
  let actual;
  let error = null;
  try {
    actual = fn();
  } catch (err) {
    error = err instanceof Error ? err.message : String(err);
  }
  const pass = error === null && JSON.stringify(actual) === JSON.stringify(expected);
  cases.push({ id, status: pass ? 'PASS' : 'FAIL', expected, actual, error });
}

const meta = { charge_amount_minor: 1_150_000, charge_currency: 'COP' };
const payment = (over = {}) => ({
  id: 'pay_1',
  bookingId: 'book_1',
  status: 'succeeded',
  amount: 11_500,
  currency: 'COP',
  provider: 'wompi',
  metadata: meta,
  ...over,
});
const booking = (status = 'confirmed') => ({ id: 'book_1', status });

check('A.matched', () => reconcilePayment(payment(), booking()).status, 'MATCHED');
check('B.orphan_payment', () => reconcilePayment(payment({ bookingId: null }), null).status, 'ORPHAN_PAYMENT');
check('B.orphan_missing_booking_row', () => reconcilePayment(payment(), undefined).status, 'ORPHAN_PAYMENT');
check('C.missing_payment', () => findMissingPayments([booking()], [payment({ status: 'failed' })]).length, 1);
check('C.no_false_positive', () => findMissingPayments([booking()], [payment()]).length, 0);
check(
  'D.amount_mismatch',
  () => reconcilePayment(payment({ metadata: { charge_amount_minor: 1_000_000, charge_currency: 'COP' } }), booking()).status,
  'AMOUNT_MISMATCH',
);
check('E.currency_mismatch', () => reconcilePayment(payment({ currency: 'USD' }), booking()).status, 'CURRENCY_MISMATCH');
check(
  'F.captured_on_pending_booking',
  () => reconcilePayment(payment(), booking('pending_payment')).status,
  'STATUS_MISMATCH',
);
check(
  'F.confirmed_on_failed_payment',
  () => reconcilePayment(payment({ status: 'failed' }), booking('confirmed')).status,
  'STATUS_MISMATCH',
);
check(
  'F.refunded_on_cancelled_booking',
  () => reconcilePayment(payment({ status: 'refunded' }), booking('cancelled')).status,
  'STATUS_MISMATCH',
);
check(
  'F.pending_on_pending_booking',
  () => reconcilePayment(payment({ status: 'pending' }), booking('pending_payment')).status,
  'MATCHED',
);
check('helper.expected_amount_from_meta', () => expectedAmountMinor(payment()), 1_150_000);
check('helper.expected_amount_fallback', () => expectedAmountMinor(payment({ metadata: null })), 1_150_000);
check('helper.currency_from_meta', () => expectedCurrency(payment()), 'COP');

// Report aggregation
check('report.counts', () => {
  const payments = [
    payment(),
    payment({ id: 'pay_2', bookingId: null }),
    payment({ id: 'pay_3', metadata: { charge_amount_minor: 9, charge_currency: 'COP' } }),
    payment({ id: 'pay_4', currency: 'USD' }),
    payment({ id: 'pay_5', status: 'failed' }),
  ];
  const bookings = [booking(), { id: 'book_9', status: 'confirmed' }];
  const out = buildReconciliationReport(payments, bookings, new Date('2026-11-14T00:00:00.000Z'));
  return {
    matched: out.totals.matched,
    anomalies: out.totals.anomalies,
    byStatus: out.byStatus,
    generatedAt: out.generatedAt,
  };
}, {
  matched: 1,
  anomalies: 5,
  byStatus: {
    MATCHED: 1,
    ORPHAN_PAYMENT: 1,
    MISSING_PAYMENT: 1,
    AMOUNT_MISMATCH: 1,
    CURRENCY_MISMATCH: 1,
    STATUS_MISMATCH: 1,
  },
  generatedAt: '2026-11-14T00:00:00.000Z',
});

check('report.zero_anomalies', () => {
  const out = buildReconciliationReport([payment()], [booking()]);
  return [out.totals.matched, out.totals.anomalies];
}, [1, 0]);

// Audit trail
const fullTrail = {
  bookingEvents: [
    { at: '2026-11-14T10:00:00.000Z', type: 'pending_payment' },
    { at: '2026-11-14T10:05:00.000Z', type: 'confirmed', from: 'pending_payment', to: 'confirmed' },
  ],
  paymentEvents: [
    { at: '2026-11-14T10:01:00.000Z', type: 'payment_created' },
    { at: '2026-11-14T10:02:00.000Z', type: 'webhook_received' },
    { at: '2026-11-14T10:03:00.000Z', type: 'payment_paid' },
  ],
  refunds: [],
  paymentStatuses: ['succeeded'],
};
check('trail.complete', () => buildTransactionTimeline(fullTrail).complete, true);
check('trail.ordered', () =>
  buildTransactionTimeline(fullTrail).entries.map((e) => e.at), [
  '2026-11-14T10:00:00.000Z',
  '2026-11-14T10:01:00.000Z',
  '2026-11-14T10:02:00.000Z',
  '2026-11-14T10:03:00.000Z',
  '2026-11-14T10:05:00.000Z',
]);
check('trail.missing_outcome', () =>
  buildTransactionTimeline({
    ...fullTrail,
    paymentEvents: [{ at: '2026-11-14T10:01:00.000Z', type: 'payment_created' }],
    paymentStatuses: ['pending'],
  }).missingSteps,
  ['payment_outcome'],
);
check('trail.missing_booking', () =>
  buildTransactionTimeline({ ...fullTrail, bookingEvents: [] }).missingSteps,
  ['booking_created'],
);
check('trail.refund_entry', () =>
  buildTransactionTimeline({
    ...fullTrail,
    refunds: [{ at: '2026-11-15T10:00:00.000Z', status: 'refunded', amountMinor: 1_150_000 }],
  }).entries.filter((e) => e.source === 'refund').length,
  1,
);

const report = {
  generatedAt: new Date().toISOString(),
  suites: ['reconciliation', 'audit-trail'],
  cases,
  summary: { total: cases.length, pass: cases.filter((c) => c.status === 'PASS').length },
};
const outDir = join(process.cwd(), 'docs', 'reports', 'assets');
await mkdir(outDir, { recursive: true });
await writeFile(join(outDir, 'financial-integrity-results.json'), JSON.stringify(report, null, 2));
for (const c of cases) {
  console.log(`${c.status} ${c.id}${c.status === 'FAIL' ? ' :: ' + JSON.stringify(c) : ''}`);
}
console.log(`summary: ${report.summary.pass}/${report.summary.total} pass`);

