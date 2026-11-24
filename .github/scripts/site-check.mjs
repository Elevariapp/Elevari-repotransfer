// Looks at the PUBLIC site the way a visitor does: status codes, the hero markers, whether Cloudflare Turnstile
// is enforced on the API, and screenshots of the home hero (Día / Tarde / Noche) on desktop and phone.
// Run by .github/workflows/site-check.yml. It reads public pages only; the single POST is a login with a made-up
// account (no token), which is how we learn whether the mobile app needs API_CLIENT_KEY.
// Env: BASE_URL (default https://elevari.live), OUT_DIR (default site-check), PW_DIR (folder with `playwright` installed),
// CHROME_PATH (optional: use this Chrome instead of Playwright's own, for local runs).
import { createRequire } from 'node:module';
import { appendFileSync, mkdirSync, writeFileSync } from 'node:fs';

const base = (process.env.BASE_URL || 'https://elevari.live').replace(/\/+$/, '');
const out = process.env.OUT_DIR || 'site-check';
const pwDir = process.env.PW_DIR;
if (!pwDir) throw new Error('PW_DIR must point to a folder where `playwright` is installed');
mkdirSync(out, { recursive: true });

const require = createRequire(`${pwDir}/package.json`);
const { chromium } = require('playwright');

const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';
const MOBILE_UA =
  'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Mobile Safari/537.36';

const report = { base, at: new Date().toISOString(), pages: [], turnstile: null, screenshots: [], problems: [] };
const lines = [];
const say = (text = '') => {
  console.log(text);
  lines.push(text);
};

async function probePage(path) {
  const started = Date.now();
  try {
    const res = await fetch(`${base}${path}`, { headers: { 'user-agent': UA, accept: 'text/html,*/*' }, redirect: 'manual' });
    const body = await res.text();
    return {
      path,
      status: res.status,
      ms: Date.now() - started,
      bytes: body.length,
      location: res.headers.get('location'),
      cache: res.headers.get('cf-cache-status'),
      body,
    };
  } catch (error) {
    return { path, status: 0, ms: Date.now() - started, bytes: 0, error: String(error).slice(0, 120), body: '' };
  }
}

say(`## Live site check: ${base}`);
say(`Run at ${report.at}`);
say();
say('| Page | Status | Time | Size |');
say('| --- | --- | --- | --- |');

const paths = ['/', '/properties', '/app', '/auth/login', '/auth/register', '/auth/forgot-password', '/legal/faq', '/robots.txt', '/health', '/bot/health'];
const bodies = {};
for (const path of paths) {
  const page = await probePage(path);
  bodies[path] = page.body;
  const { body, ...rest } = page;
  report.pages.push(rest);
  say(`| \`${path}\` | ${page.status || 'error'}${page.location ? ` → ${page.location}` : ''} | ${page.ms} ms | ${Math.round(page.bytes / 1024)} KB |`);
}
for (const page of report.pages) {
  if (page.status === 0 || page.status >= 500) report.problems.push(`${page.path} answered ${page.status || page.error}`);
}

const home = bodies['/'] || '';
const hero = {
  sceneInitScript: home.includes('data-elevari-scene'),
  sceneSwitcher: home.includes('sc-sw'),
  oldDronePhoto: /drone|hero-drone/i.test(home),
};
report.hero = hero;
say();
say('**Hero markers in the home HTML**');
say(`- Scene system present (data-elevari-scene): ${hero.sceneInitScript ? 'yes' : 'NO'}`);
say(`- Día · Tarde · Noche switcher present: ${hero.sceneSwitcher ? 'yes' : 'NO'}`);
if (!hero.sceneInitScript) report.problems.push('The home HTML does not contain the scene system: the old hero is still being served');

const appPage = bodies['/app'] || '';
report.install = {
  pageRenders: appPage.includes('Instalar la app'),
  downloadButton: /Descargar (para Android|el APK)/.test(appPage),
  comingSoon: appPage.includes('Disponible muy pronto'),
};
say();
say('**Install page (/app)**');
say(`- Renders: ${report.install.pageRenders ? 'yes' : 'NO'}; APK button: ${report.install.downloadButton ? 'yes' : 'not yet'}; "Disponible muy pronto": ${report.install.comingSoon ? 'shown' : 'no'}`);

// Is Turnstile enforced? One login with a made-up account and no challenge token.
const loginHtml = bodies['/auth/login'] || '';
const widgetInHtml = /challenges\.cloudflare\.com|cf-turnstile|turnstile/i.test(loginHtml);
let apiProbe = { status: 0, code: null };
try {
  const res = await fetch(`${base}/api/v1/auth/login`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'user-agent': UA, accept: 'application/json' },
    body: JSON.stringify({ email: 'site-check@example.invalid', password: 'not-a-real-password-1' }),
  });
  const json = await res.json().catch(() => ({}));
  apiProbe = { status: res.status, code: typeof json?.code === 'string' ? json.code : null };
} catch (error) {
  apiProbe = { status: 0, code: `fetch_error: ${String(error).slice(0, 80)}` };
}
const enforced = apiProbe.code === 'turnstile_failed';
report.turnstile = { widgetInLoginHtml: widgetInHtml, apiStatus: apiProbe.status, apiCode: apiProbe.code, enforcedForNativeApps: enforced };
say();
say('**Turnstile (decides whether the Android app can sign in without API_CLIENT_KEY)**');
say(`- Widget referenced by the login page: ${widgetInHtml ? 'yes' : 'no'}`);
say(`- Login without a challenge token: HTTP ${apiProbe.status}, code \`${apiProbe.code ?? 'none'}\``);
say(
  enforced
    ? '- Result: ENFORCED. The app needs API_CLIENT_KEY on the server and the same value in the EXPO_PUBLIC_API_KEY repository secret, or app sign-in fails.'
    : apiProbe.status === 401 || apiProbe.status === 429
      ? '- Result: NOT enforced for this request. The app can sign in without a key.'
      : '- Result: inconclusive (see status above).',
);

// Screenshots of the real thing.
const browser = await chromium.launch({
  executablePath: process.env.CHROME_PATH || undefined,
  args: ['--no-sandbox', '--disable-dev-shm-usage'],
});
const scenes = [
  ['day', 'Día'],
  ['golden', 'Tarde'],
  ['night', 'Noche'],
];
const viewports = [
  { name: 'desktop', width: 1440, height: 900, dpr: 1, mobile: false, ua: UA },
  { name: 'mobile', width: 390, height: 844, dpr: 2, mobile: true, ua: MOBILE_UA },
];

say();
say('**Screenshots**');
for (const vp of viewports) {
  const ctx = await browser.newContext({
    viewport: { width: vp.width, height: vp.height },
    deviceScaleFactor: vp.dpr,
    isMobile: vp.mobile,
    hasTouch: vp.mobile,
    userAgent: vp.ua,
    locale: 'es-CO',
    timezoneId: 'America/Bogota',
  });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (error) => errors.push(`pageerror: ${String(error).slice(0, 140)}`));
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(`console: ${msg.text().slice(0, 140)}`);
  });

  const response = await page.goto(`${base}/`, { waitUntil: 'load', timeout: 45_000 }).catch(() => null);
  await page.waitForTimeout(2500);
  const title = await page.title();
  if (!response || response.status() >= 400 || /just a moment|attention required/i.test(title)) {
    report.problems.push(`${vp.name}: the browser did not get the real page (status ${response?.status() ?? 'none'}, title "${title}")`);
  }

  for (const [scene, label] of scenes) {
    const choice = page.locator(`button[role="radio"][data-scene="${scene}"]`).first();
    if (await choice.isVisible().catch(() => false)) {
      await choice.click();
    } else {
      await page.evaluate((name) => document.documentElement.setAttribute('data-elevari-scene', name), scene);
    }
    await page.waitForTimeout(1800);
    const file = `home-${vp.name}-${scene}.png`;
    await page.screenshot({ path: `${out}/${file}` });
    report.screenshots.push(file);
    say(`- ${file} (${label})`);
  }

  if (vp.name === 'desktop') {
    await page.screenshot({ path: `${out}/home-desktop-full.png`, fullPage: true });
    report.screenshots.push('home-desktop-full.png');
    say('- home-desktop-full.png (full page)');
  }

  for (const [path, name] of [
    ['/app', 'install'],
    ['/auth/login', 'login'],
  ]) {
    await page.goto(`${base}${path}`, { waitUntil: 'load', timeout: 45_000 }).catch(() => null);
    await page.waitForTimeout(1500);
    const file = `${name}-${vp.name}.png`;
    await page.screenshot({ path: `${out}/${file}` });
    report.screenshots.push(file);
    say(`- ${file}`);
  }

  const unique = [...new Set(errors)].slice(0, 8);
  report[`${vp.name}Errors`] = unique;
  say(unique.length ? `- ${vp.name} browser errors: ${unique.join(' | ')}` : `- ${vp.name}: no browser errors`);
  await ctx.close();
}
await browser.close();

say();
say(report.problems.length ? `**Problems:** ${report.problems.join('; ')}` : '**No problems found.**');

writeFileSync(`${out}/report.json`, JSON.stringify(report, null, 2));
writeFileSync(`${out}/summary.md`, `${lines.join('\n')}\n`);
if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, `${lines.join('\n')}\n`);
if (report.problems.length) process.exitCode = 1;
