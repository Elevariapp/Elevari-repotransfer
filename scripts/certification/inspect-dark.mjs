import { chromium } from '@playwright/test';
const AXE = 'node_modules/axe-core/axe.min.js';
const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.addInitScript(() => {
  localStorage.setItem('elevari-theme', 'dark');
  localStorage.setItem('elevari-contrast', 'normal');
});
await page.goto('http://localhost:3000/', { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(1200);
await page.addScriptTag({ path: AXE });
const out = await page.evaluate(async () => {
  const res = await window.axe.run(document, {
    runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'] },
  });
  return res.violations.map((v) => ({
    id: v.id,
    nodes: v.nodes.slice(0, 20).map((n) => ({
      target: n.target.join(' '),
      summary: (n.failureSummary || '').split('\n').slice(0, 4).join(' | '),
    })),
  }));
});
console.log(JSON.stringify(out, null, 1));
await browser.close();
