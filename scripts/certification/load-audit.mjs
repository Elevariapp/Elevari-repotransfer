/**
 * PPI-6 load & scale certification (web tier).
 *
 * Measures the Next.js server (SSR/static pages) at 100/250/500/1000
 * concurrent connections. The API + PostgreSQL are NOT exercised here because
 * no database is available in this environment; results describe the web tier
 * only and are labelled accordingly.
 *
 * Usage: node scripts/certification/load-audit.mjs
 */
import autocannon from 'autocannon';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const BASE = process.env.CERT_BASE_URL ?? 'http://localhost:3000';
const LEVELS = [100, 250, 500, 1000];
const DURATION = 8;
const ROUTES = [
  { key: 'home', path: '/' },
  { key: 'legal', path: '/legal/accessibility' },
];

function run(url, connections) {
  return new Promise((resolve, reject) => {
    const instance = autocannon(
      { url, connections, duration: DURATION, pipelining: 1, timeout: 10 },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      },
    );
    autocannon.track(instance, { renderProgressBar: false });
  });
}

const results = { generatedAt: new Date().toISOString(), baseUrl: BASE, durationSeconds: DURATION, scope: 'web-tier-only', runs: [] };

for (const route of ROUTES) {
  for (const connections of LEVELS) {
    const url = `${BASE}${route.path}`;
    process.stdout.write(`${route.key} @ ${connections} conns ... `);
    const r = await run(url, connections);
    const row = {
      route: route.key,
      connections,
      requestsPerSecond: Math.round(r.requests.average),
      latencyMs: {
        p50: r.latency.p50,
        p97_5: r.latency.p97_5,
        p99: r.latency.p99,
        max: r.latency.max,
      },
      throughputMb: Number((r.throughput.average / 1024 / 1024).toFixed(2)),
      errors: r.errors,
      timeouts: r.timeouts,
      non2xx: r.non2xx,
      totalRequests: r.requests.total,
    };
    results.runs.push(row);
    console.log(
      `${row.requestsPerSecond} rps · p50 ${row.latencyMs.p50}ms · p99 ${row.latencyMs.p99}ms · ` +
        `errors ${row.errors} · non2xx ${row.non2xx}`,
    );
  }
}

await mkdir(join(process.cwd(), 'docs', 'reports', 'assets'), { recursive: true });
await writeFile(join(process.cwd(), 'docs', 'reports', 'assets', 'load-results.json'), JSON.stringify(results, null, 2));

const failures = results.runs.filter((r) => r.errors > 0 || r.non2xx > 0 || r.timeouts > 0);
console.log(failures.length === 0 ? 'PASS: 0 errors across all levels' : `FAIL: ${failures.length} runs with errors`);
