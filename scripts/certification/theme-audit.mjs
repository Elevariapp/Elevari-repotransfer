/**
 * Theme certification: light / dark / high-contrast.
 * Verifies that tokens resolve, measures contrast and runs axe per theme.
 * Usage: node scripts/certification/theme-audit.mjs
 */
import { chromium } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const BASE = process.env.CERT_BASE_URL ?? 'http://localhost:3000';
const OUT = join(process.cwd(), 'docs', 'reports', 'assets');
const AXE = join(process.cwd(), 'node_modules', 'axe-core', 'axe.min.js');

const modes = [
  { id: 'light', theme: 'light', contrast: 'normal' },
  { id: 'dark', theme: 'dark', contrast: 'normal' },
  { id: 'high-contrast', theme: 'light', contrast: 'high' },
];

function luminance([r, g, b]) {
  const ch = [r, g, b].map((v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * ch[0] + 0.7152 * ch[1] + 0.0722 * ch[2];
}
function ratio(fg, bg) {
  const a = luminance(fg);
  const b = luminance(bg);
  return ((Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05)).toFixed(2);
}
function parseRgb(value) {
  const m = value.match(/\d+(\.\d+)?/g) ?? [];
  return m.slice(0, 3).map(Number);
}

await mkdir(OUT, { recursive: true });
const browser = await chromium.launch({ channel: process.env.CERT_BROWSER_CHANNEL ?? 'chrome' });
const results = { generatedAt: new Date().toISOString(), modes: [] };

for (const mode of modes) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  await page.addInitScript(
    ([theme, contrast]) => {
      localStorage.setItem('elevari-theme', theme);
      localStorage.setItem('elevari-contrast', contrast);
    },
    [mode.theme, mode.contrast],
  );
  await page.goto(`${BASE}/`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1200);

  const styles = await page.evaluate(() => {
    const root = getComputedStyle(document.documentElement);
    const body = getComputedStyle(document.body);
    const h1 = document.querySelector('h1');
    const link = document.querySelector('a[href="/properties"]');
    return {
      dataTheme: document.documentElement.dataset.theme ?? null,
      dataContrast: document.documentElement.dataset.contrast ?? null,
      bodyBg: body.backgroundColor,
      bodyColor: body.color,
      h1Color: h1 ? getComputedStyle(h1).color : null,
      linkColor: link ? getComputedStyle(link).color : null,
      tokenIvory: root.getPropertyValue('--color-elevari-ivory').trim(),
      tokenSlate: root.getPropertyValue('--color-elevari-slate').trim(),
      tokenMuted: root.getPropertyValue('--color-elevari-muted').trim(),
    };
  });

  await page.addScriptTag({ path: AXE });
  const axe = await page.evaluate(async () => {
    const res = await window.axe.run(document, {
      runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'] },
      resultTypes: ['violations'],
    });
    return res.violations.map((v) => ({ id: v.id, impact: v.impact, nodes: v.nodes.length }));
  });

  await page.screenshot({ path: join(OUT, `theme-${mode.id}.jpg`), fullPage: false, type: 'jpeg', quality: 80 });

  const bodyContrast = ratio(parseRgb(styles.bodyColor), parseRgb(styles.bodyBg));
  results.modes.push({ mode: mode.id, styles, axe, bodyContrast });

  console.log(
    `${mode.id}: theme=${styles.dataTheme} contrast=${styles.dataContrast ?? 'normal'} ` +
      `bodyContrast=${bodyContrast} axe=${axe.length}`,
  );
  await context.close();
}

await writeFile(join(OUT, 'theme-results.json'), JSON.stringify(results, null, 2));
await browser.close();
