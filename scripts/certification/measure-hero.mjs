import { chromium } from '@playwright/test';

const browser = await chromium.launch({ channel: 'chrome' });
for (const vp of [
  { width: 390, height: 844 },
  { width: 360, height: 800 },
]) {
  const page = await browser.newPage({ viewport: vp });
  await page.goto('http://localhost:3000/', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(900);
  const data = await page.evaluate(() => {
    const rect = (sel) => {
      const el = document.querySelector(sel);
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return { top: Math.round(r.top), bottom: Math.round(r.bottom), height: Math.round(r.height) };
    };
    return {
      viewport: window.innerHeight,
      hero: rect('#buscar'),
      searchBar: rect('#buscar .elevari-search-luxury'),
      searchButton: rect('#buscar .elevari-btn-primary'),
      badges: rect('#buscar ul'),
      h1: rect('#buscar h1'),
    };
  });
  console.log(JSON.stringify({ vp, ...data }));
  await page.close();
}
await browser.close();
