/**
 * Phase 3.5 — axe-core + interaction accessibility audit.
 * Requires running server and axe-core in node_modules.
 * Usage: node scripts/certification/a11y-audit.mjs
 */
import { chromium } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const BASE = process.env.CERT_BASE_URL ?? 'http://localhost:3000';
const OUT = join(process.cwd(), 'docs', 'reports', 'assets');
const AXE_PATH = join(process.cwd(), 'node_modules', 'axe-core', 'axe.min.js');

const ROUTES = [
  { key: 'home', path: '/' },
  { key: 'properties', path: '/properties' },
  { key: 'legal-faq', path: '/legal/faq' },
  { key: 'legal-accessibility', path: '/legal/accessibility' },
  { key: 'auth-login', path: '/auth/login' },
  { key: 'auth-register', path: '/auth/register' },
  { key: 'not-found', path: '/ruta-inexistente-certificacion' },
];

const VIEWPORTS = [
  { name: '390x844', width: 390, height: 844 },
  { name: '1440x900', width: 1440, height: 900 },
];

await mkdir(OUT, { recursive: true });

const browser = await chromium.launch({ channel: process.env.CERT_BROWSER_CHANNEL ?? 'chrome' });
const results = { baseUrl: BASE, generatedAt: new Date().toISOString(), axe: [], interactions: {} };

for (const vp of VIEWPORTS) {
  const context = await browser.newContext({ viewport: { width: vp.width, height: vp.height } });
  const page = await context.newPage();

  for (const route of ROUTES) {
    await page.goto(`${BASE}${route.path}`, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(1200);
    await page.addScriptTag({ path: AXE_PATH });
    const raw = await page.evaluate(async () => {
      // @ts-expect-error injected at runtime
      return await window.axe.run(document, {
        runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'] },
        resultTypes: ['violations', 'incomplete'],
      });
    });

    results.axe.push({
      viewport: vp.name,
      route: route.path,
      violations: raw.violations.map((v) => ({
        id: v.id,
        impact: v.impact,
        help: v.help,
        nodes: v.nodes.length,
        targets: v.nodes.slice(0, 5).map((n) => n.target.join(' ')),
        failure: (v.nodes[0]?.failureSummary ?? '').slice(0, 200),
      })),
      incomplete: raw.incomplete.length,
    });
  }
  await context.close();
}

// —— Interaction tests (home, desktop) ——
{
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  await page.goto(`${BASE}/`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(400);

  await page.keyboard.press('Tab');
  await page.waitForTimeout(300);
  const skip = await page.evaluate(() => {
    const el = document.activeElement;
    if (!el) return null;
    const style = getComputedStyle(el);
    const rect = el.getBoundingClientRect();
    return {
      text: (el.textContent || '').trim(),
      tag: el.tagName,
      outline: `${style.outlineWidth} ${style.outlineStyle} ${style.outlineColor}`,
      top: Math.round(rect.top),
      visible: rect.top >= 0 && rect.height > 0,
    };
  });
  await page.screenshot({ path: join(OUT, 'focus-skip-link.jpg'), type: 'jpeg', quality: 80 });

  const tabOrder = [];
  for (let i = 0; i < 12; i += 1) {
    await page.keyboard.press('Tab');
    tabOrder.push(
      await page.evaluate(() => {
        const el = document.activeElement;
        if (!el) return 'none';
        const style = getComputedStyle(el);
        const label =
          el.getAttribute('aria-label') ||
          (el.textContent || '').trim().slice(0, 30) ||
          el.getAttribute('href') ||
          el.tagName;
        return `${el.tagName}:${label}:${style.outlineStyle}`;
      }),
    );
  }
  results.interactions.keyboard = { skipLink: skip, tabOrder };
  await context.close();
}

// —— Reduced motion ——
{
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
  const page = await context.newPage();
  await page.goto(`${BASE}/`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(300);
  results.interactions.reducedMotion = await page.evaluate(() => {
    const el = document.querySelector('.animate-slide-up');
    if (!el) return { found: false };
    const style = getComputedStyle(el);
    return {
      found: true,
      animationDuration: style.animationDuration,
      scrollBehavior: getComputedStyle(document.documentElement).scrollBehavior,
    };
  });
  await context.close();
}

// —— Mobile menu dialog behaviour ——
{
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  await page.goto(`${BASE}/`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(300);
  const trigger = page.locator('button[aria-label="Abrir menú"]');
  const exists = await trigger.count();
  let opened = null;
  let closedByEscape = null;
  if (exists) {
    await trigger.click();
    await page.waitForTimeout(250);
    opened = await page.evaluate(() => {
      const btn = document.querySelector('button[aria-label="Cerrar menú"]');
      return {
        ariaExpanded: btn?.getAttribute('aria-expanded') ?? null,
        panelVisible: !!document.querySelector('.elevari-header-mobile-panel'),
      };
    });
    await page.screenshot({ path: join(OUT, 'mobile-menu-open.jpg'), type: 'jpeg', quality: 80 });
    await page.keyboard.press('Escape');
    await page.waitForTimeout(250);
    closedByEscape = await page.evaluate(() => !document.querySelector('.elevari-header-mobile-panel'));
  }
  results.interactions.mobileMenu = { triggerFound: exists > 0, opened, closedByEscape };
  await context.close();
}

// —— Form validation ——
{
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  await page.goto(`${BASE}/auth/login`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(400);
  const submit = page.locator('form button[type="submit"]').first();
  const hasForm = (await submit.count()) > 0;
  let state = null;
  if (hasForm) {
    await submit.click();
    await page.waitForTimeout(600);
    state = await page.evaluate(() => ({
      invalidFields: document.querySelectorAll('[aria-invalid="true"]').length,
      alerts: Array.from(document.querySelectorAll('[role="alert"]')).map((n) => (n.textContent || '').trim().slice(0, 80)),
      nativeValidation: Array.from(document.querySelectorAll('input'))
        .map((i) => i.validationMessage)
        .filter(Boolean),
    }));
    await page.screenshot({ path: join(OUT, 'login-validation.jpg'), type: 'jpeg', quality: 80 });
  }
  results.interactions.formValidation = { hasForm, ...state };
  await context.close();
}

await writeFile(join(OUT, 'a11y-results.json'), JSON.stringify(results, null, 2));

const violationCount = results.axe.reduce((a, r) => a + r.violations.length, 0);
const byImpact = {};
for (const r of results.axe) for (const v of r.violations) byImpact[v.impact] = (byImpact[v.impact] || 0) + 1;
console.log(`axe runs: ${results.axe.length}`);
console.log(`violations: ${violationCount}`, JSON.stringify(byImpact));
console.log('skip link:', JSON.stringify(results.interactions.keyboard?.skipLink));
console.log('mobile menu:', JSON.stringify(results.interactions.mobileMenu));
console.log('reduced motion:', JSON.stringify(results.interactions.reducedMotion));
console.log('form validation:', JSON.stringify(results.interactions.formValidation));

await browser.close();
