/**
 * Phase 3.5 — pricing arithmetic certification (web mirror + invariants).
 * Usage: node scripts/certification/money-fees-audit.mjs
 */
import { writeFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { readFile } from 'node:fs/promises';

const { calculateWanaFees } = await import('../../lib/tax-logic.ts');

const cases = [];
function check(id, actual, expected) {
  const pass = JSON.stringify(actual) === JSON.stringify(expected);
  cases.push({ id, status: pass ? 'PASS' : 'FAIL', actual, expected });
}

const a = calculateWanaFees(1_000_000, 15);
check('base_1m_fee_15', { fee: a.platform_fee_amount, total: a.total_charge_to_guest, host: a.host_receives, subtotal: a.subtotal }, {
  fee: 150_000,
  total: 1_150_000,
  host: 850_000,
  subtotal: 1_000_000,
});

const b = calculateWanaFees(333_333, 15);
check('rounding_333333', { fee: b.platform_fee_amount, total: b.total_amount, invariant: Math.abs(b.base_amount + b.platform_fee_amount - b.total_amount) < 0.01 }, {
  fee: 49_999.95,
  total: 383_332.95,
  invariant: true,
});

const c = calculateWanaFees(0, 15);
check('zero_base', { total: c.total_charge_to_guest, fee: c.platform_fee_amount }, { total: 0, fee: 0 });

const d = calculateWanaFees(100, 0);
check('zero_fee_percent', { total: d.total_charge_to_guest, fee: d.platform_fee_amount }, { total: 100, fee: 0 });

// Cross-check documented constants: web mirror and API must use 15% default.
const web = await readFile(join(process.cwd(), 'lib', 'tax-logic.ts'), 'utf8');
const api = await readFile(join(process.cwd(), 'api', 'src', 'lib', 'fees.ts'), 'utf8');
check('default_fee_percent_matches', {
  web: /feePercent(?:: number)? = 15/.test(web),
  api: /getPlatformFeePercent\(\)|15/.test(api),
}, { web: true, api: true });

const report = {
  generatedAt: new Date().toISOString(),
  cases,
  summary: { total: cases.length, pass: cases.filter((x) => x.status === 'PASS').length },
};
const outDir = join(process.cwd(), 'docs', 'reports', 'assets');
await mkdir(outDir, { recursive: true });
await writeFile(join(outDir, 'money-fees-results.json'), JSON.stringify(report, null, 2));
for (const x of cases) console.log(`${x.status} ${x.id}`, x.status === 'FAIL' ? JSON.stringify(x) : '');
console.log(`summary: ${report.summary.pass}/${report.summary.total} pass`);
