/**
 * PPI-4 observability certification.
 * Starts a local webhook receiver, triggers a client-side unhandled rejection
 * and verifies the payload arrives through /api/observability.
 *
 * Requires the Next server started with:
 *   OBSERVABILITY_WEBHOOK_URL=http://localhost:4010/ingest
 *
 * Usage: node scripts/certification/observability-audit.mjs
 */
import { createServer } from 'node:http';
import { chromium } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const BASE = process.env.CERT_BASE_URL ?? 'http://localhost:3000';
const PORT = 4010;
const OUT = join(process.cwd(), 'docs', 'reports', 'assets');

const received = [];
const server = createServer((req, res) => {
  let body = '';
  req.on('data', (chunk) => {
    body += chunk;
  });
  req.on('end', () => {
    try {
      received.push({ path: req.url, payload: JSON.parse(body) });
    } catch {
      received.push({ path: req.url, raw: body.slice(0, 500) });
    }
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end('{"ok":true}');
  });
});

await new Promise((resolve) => server.listen(PORT, resolve));
console.log(`receiver listening on :${PORT}`);

const browser = await chromium.launch({ channel: process.env.CERT_BROWSER_CHANNEL ?? 'chrome' });
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
const consoleErrors = [];
page.on('console', (msg) => {
  if (msg.type() === 'error') consoleErrors.push(msg.text().slice(0, 200));
});

await page.goto(`${BASE}/`, { waitUntil: 'networkidle' });
await page.waitForTimeout(500);

// Trigger an unhandled rejection: the provider should report it.
await page.evaluate(() => {
  void Promise.reject(new Error('ppi4-observability-probe'));
});

let forwarded = null;
for (let i = 0; i < 25; i += 1) {
  await page.waitForTimeout(200);
  forwarded = received.find((r) => JSON.stringify(r.payload ?? r.raw ?? '').includes('ppi4-observability-probe'));
  if (forwarded) break;
}

// Also verify the endpoint rejects malformed bodies.
const bad = await page.evaluate(async () => {
  const res = await fetch('/api/observability', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: 'not-json',
  });
  return res.status;
});

await mkdir(OUT, { recursive: true });
const result = {
  generatedAt: new Date().toISOString(),
  receiverPort: PORT,
  forwardedPayload: forwarded?.payload ?? null,
  malformedBodyStatus: bad,
  consoleErrors,
  pass: Boolean(forwarded) && bad === 400,
};
await writeFile(join(OUT, 'observability-results.json'), JSON.stringify(result, null, 2));

console.log(`forwarded=${Boolean(forwarded)} malformedStatus=${bad} consoleErrors=${consoleErrors.length}`);
if (forwarded) {
  console.log(JSON.stringify(forwarded.payload).slice(0, 400));
}
console.log(result.pass ? 'PASS observability pipeline' : 'FAIL observability pipeline');

await browser.close();
server.close();
process.exitCode = result.pass ? 0 : 1;
