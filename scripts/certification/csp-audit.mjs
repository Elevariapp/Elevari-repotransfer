/**
 * CSP certification: collects securitypolicyviolation events per route and
 * verifies the policy header is present. Works for report-only and enforce.
 * Usage: node scripts/certification/csp-audit.mjs
 */
import { chromium } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const BASE = process.env.CERT_BASE_URL ?? 'http://localhost:3000';
const OUT = join(process.cwd(), 'docs', 'reports', 'assets');
const ROUTES = ['/', '/properties', '/legal/accessibility', '/auth/login', '/auth/register', '/ruta-csp-404'];

await mkdir(OUT, { recursive: true });
const browser = await chromium.launch({ channel: process.env.CERT_BROWSER_CHANNEL ?? 'chrome' });
const results = { generatedAt: new Date().toISOString(), baseUrl: BASE, routes: [] };

for (const route of ROUTES) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  await page.addInitScript(() => {
    window.__cspViolations = [];
    document.addEventListener('securitypolicyviolation', (event) => {
      window.__cspViolations.push({
        directive: event.violatedDirective,
        blockedURI: event.blockedURI,
        sourceFile: event.sourceFile,
        disposition: event.disposition,
      });
    });
  });

  const response = await page.goto(`${BASE}${route}`, { waitUntil: 'networkidle', timeout: 30000 }).catch(() => null);
  await page.waitForTimeout(800);

  const headers = response?.headers() ?? {};
  const violations = await page.evaluate(() => window.__cspViolations ?? []);
  const consoleErrors = [];
  page.on('pageerror', (error) => consoleErrors.push(String(error).slice(0, 160)));

  results.routes.push({
    route,
    status: response?.status() ?? null,
    cspHeader: headers['content-security-policy'] ?? null,
    cspReportOnly: headers['content-security-policy-report-only'] ?? null,
    violations,
  });

  console.log(
    `${route} status=${response?.status()} ` +
      `enforce=${headers['content-security-policy'] ? 'yes' : 'no'} ` +
      `reportOnly=${headers['content-security-policy-report-only'] ? 'yes' : 'no'} ` +
      `violations=${violations.length}`,
  );
  for (const v of violations.slice(0, 6)) {
    console.log(`   ${v.directive} blocked ${v.blockedURI} (${v.disposition})`);
  }

  await context.close();
}

await writeFile(join(OUT, 'csp-results.json'), JSON.stringify(results, null, 2));
await browser.close();
