/**
 * Phase 3.5 — visual + accessibility certification harness.
 * Requires a running server (npm run start) and axe-core in node_modules.
 * Usage: node scripts/certification/visual-audit.mjs
 */
import { chromium } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const BASE = process.env.CERT_BASE_URL ?? 'http://localhost:3000';
const OUT = join(process.cwd(), 'docs', 'reports', 'assets', 'visual');
const AXE_PATH = join(process.cwd(), 'node_modules', 'axe-core', 'axe.min.js');

const VIEWPORTS = [
  { name: '360x800', width: 360, height: 800 },
  { name: '390x844', width: 390, height: 844 },
  { name: '768x1024', width: 768, height: 1024 },
  { name: '1024x768', width: 1024, height: 768 },
  { name: '1366x768', width: 1366, height: 768 },
  { name: '1440x900', width: 1440, height: 900 },
  { name: '1920x1080', width: 1920, height: 1080 },
];

const ROUTES = [
  { key: 'home', path: '/' },
  { key: 'properties-error-state', path: '/properties' },
  { key: 'legal-faq', path: '/legal/faq' },
  { key: 'legal-privacy', path: '/legal/privacy' },
  { key: 'legal-terms', path: '/legal/terms' },
  { key: 'legal-accessibility', path: '/legal/accessibility' },
  { key: 'auth-login', path: '/auth/login' },
  { key: 'auth-register', path: '/auth/register' },
  { key: 'not-found', path: '/ruta-inexistente-certificacion' },
];

const AXE_VIEWPORTS = ['390x844', '1440x900'];

function slug(path) {
  return path === '/' ? 'home' : path.replace(/^\//, '').replace(/\//g, '-');
}

async function collectLayoutMetrics(page) {
  return page.evaluate(() => {
    const doc = document.documentElement;
    const vw = window.innerWidth;
    const overflowing = [];
    for (const el of Array.from(document.querySelectorAll('body *'))) {
      const rect = el.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) continue;
      if (rect.right > vw + 2 || rect.left < -2) {
        const style = getComputedStyle(el);
        const parent = el.parentElement;
        const parentScrolls = parent ? getComputedStyle(parent).overflowX !== 'visible' : false;
        if (style.position === 'fixed' || parentScrolls) continue;
        overflowing.push({
          tag: el.tagName.toLowerCase(),
          cls: (el.className || '').toString().slice(0, 60),
          right: Math.round(rect.right),
          left: Math.round(rect.left),
        });
      }
    }
    const unnamed = Array.from(document.querySelectorAll('button, a[href]')).filter((el) => {
      const text = (el.innerText || '').trim();
      const label = el.getAttribute('aria-label') || el.getAttribute('aria-labelledby');
      const title = el.getAttribute('title');
      return !text && !label && !title;
    }).length;

    return {
      viewportWidth: vw,
      scrollWidth: doc.scrollWidth,
      horizontalOverflow: doc.scrollWidth > vw + 2,
      overflowingElements: overflowing.slice(0, 8),
      overflowingCount: overflowing.length,
      h1Count: document.querySelectorAll('h1').length,
      images: document.images.length,
      imagesMissingAlt: Array.from(document.images).filter((i) => !i.hasAttribute('alt')).length,
      unnamedInteractive: unnamed,
      title: document.title,
      lang: doc.lang,
    };
  });
}

await mkdir(OUT, { recursive: true });

const browser = await chromium.launch(
  process.env.CERT_BROWSER_CHANNEL
    ? { channel: process.env.CERT_BROWSER_CHANNEL }
    : { channel: 'chrome' },
);
const report = { baseUrl: BASE, generatedAt: new Date().toISOString(), routes: [], axe: [], findings: [] };

for (const vp of VIEWPORTS) {
  const context = await browser.newContext({
    viewport: { width: vp.width, height: vp.height },
    deviceScaleFactor: 1,
  });
  const page = await context.newPage();

  for (const route of ROUTES) {
    const entry = { viewport: vp.name, route: route.path, key: route.key };
    try {
      const response = await page.goto(`${BASE}${route.path}`, {
        waitUntil: 'domcontentloaded',
        timeout: 30000,
      });
      await page.waitForTimeout(500);
      entry.status = response?.status() ?? null;
      Object.assign(entry, await collectLayoutMetrics(page));
      const file = `${slug(route.path)}-${vp.name}.jpg`;
      await page.screenshot({ path: join(OUT, file), fullPage: true, type: 'jpeg', quality: 70 });
      entry.screenshot = `docs/reports/assets/visual/${file}`;
    } catch (error) {
      entry.error = String(error).slice(0, 200);
    }
    report.routes.push(entry);
  }
  await context.close();
}

await writeFile(join(OUT, '..', 'visual-metrics.json'), JSON.stringify(report, null, 2));
console.log(`visual metrics: ${report.routes.length} route/viewport combinations`);
console.log(`overflow failures: ${report.routes.filter((r) => r.horizontalOverflow).length}`);
console.log(`missing alt: ${report.routes.reduce((a, r) => a + (r.imagesMissingAlt || 0), 0)}`);
console.log(`unnamed interactive: ${report.routes.reduce((a, r) => a + (r.unnamedInteractive || 0), 0)}`);

await browser.close();
