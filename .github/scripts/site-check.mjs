// Looks at the PUBLIC site the way a visitor does: status codes, the hero markers, whether Cloudflare Turnstile
// is enforced on the API, and screenshots of the home hero (Día / Tarde / Noche) on desktop and phone.
// Run by .github/workflows/site-check.yml. It reads public pages only; the single POST is a login with a made-up
// account (no token), which is how we learn whether the mobile app needs API_CLIENT_KEY.
// Env: BASE_URL (default https://elevari.live), OUT_DIR (default site-check), PW_DIR (folder with `playwright` installed),
// CHROME_PATH (optional: use this Chrome instead of Playwright's own, for local runs).
import { execFile } from 'node:child_process';
import { createRequire } from 'node:module';
import { appendFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { promisify } from 'node:util';

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

const curl = promisify(execFile);

// curl, not fetch: Cloudflare's bot protection answers Node's fetch with its challenge page (HTTP 403,
// `cf-mitigated: challenge`) even with a browser User-Agent, and lets curl through. A challenged request
// says nothing about the site, so it is reported as such instead of being read as the page.
async function request(path, { headers = {}, body } = {}) {
  const started = Date.now();
  const args = ['-sS', '-i', '--max-time', '25', '-A', UA, '-H', 'accept-language: es-CO,es;q=0.9'];
  for (const [name, value] of Object.entries(headers)) args.push('-H', `${name}: ${value}`);
  if (body) args.push('--data-raw', body);
  try {
    const { stdout } = await curl('curl', [...args, `${base}${path}`], { maxBuffer: 64 * 1024 * 1024 });
    // `-i` prints each response's headers (an interim 1xx one first, if any) before the body.
    let rest = stdout;
    let status = 0;
    let head = {};
    while (rest.startsWith('HTTP/')) {
      const end = rest.indexOf('\r\n\r\n');
      if (end === -1) break;
      const [statusLine, ...headerLines] = rest.slice(0, end).split('\r\n');
      status = Number(statusLine.split(' ')[1]) || 0;
      head = Object.fromEntries(headerLines.map((line) => [line.slice(0, line.indexOf(':')).toLowerCase(), line.slice(line.indexOf(':') + 1).trim()]));
      rest = rest.slice(end + 4);
      if (status >= 200) break;
    }
    return {
      path,
      status,
      ms: Date.now() - started,
      bytes: rest.length,
      location: head.location ?? null,
      cache: head['cf-cache-status'] ?? null,
      challenged: head['cf-mitigated'] === 'challenge',
      body: rest,
    };
  } catch (error) {
    const reason = String(error.stderr || error).trim().slice(0, 120);
    return { path, status: 0, ms: Date.now() - started, bytes: 0, challenged: false, error: reason, body: '' };
  }
}

/** Why a page could not be read, or null when it was. */
function unread(page) {
  if (page.challenged) return 'Cloudflare challenged the request';
  if (page.status === 200) return null;
  return page.status ? `it answered ${page.status}` : `no answer (${page.error})`;
}

say(`## Live site check: ${base}`);
say(`Run at ${report.at}`);
say();
say('| Page | Status | Time | Size |');
say('| --- | --- | --- | --- |');

const paths = ['/', '/properties', '/app', '/auth/login', '/auth/register', '/auth/forgot-password', '/legal/faq', '/robots.txt', '/health', '/bot/health'];
const pages = {};
for (const path of paths) {
  const page = await request(path, { headers: { accept: 'text/html,*/*' } });
  pages[path] = page;
  const { body, ...rest } = page;
  report.pages.push(rest);
  const status = page.challenged ? `${page.status} (Cloudflare challenge)` : page.status || 'error';
  say(`| \`${path}\` | ${status}${page.location ? ` → ${page.location}` : ''} | ${page.ms} ms | ${Math.round(page.bytes / 1024)} KB |`);
}
for (const page of report.pages) {
  if (page.status === 0 || page.status >= 500) report.problems.push(`${page.path} answered ${page.status || page.error}`);
}
const challenged = report.pages.filter((page) => page.challenged).map((page) => page.path);
if (challenged.length) {
  say();
  say(`**Cloudflare challenged ${challenged.length} of ${paths.length} requests** (${challenged.join(', ')}). That is its bot protection answering this checker, not the site failing; those pages could not be read.`);
}

const home = pages['/'];
const homeUnread = unread(home);
const hero = {
  sceneInitScript: home.body.includes('data-elevari-scene'),
  sceneSwitcher: home.body.includes('sc-sw'),
  oldDronePhoto: /drone|hero-drone/i.test(home.body),
  // The production image once resolved the home page to the /app page's file (next.config.ts, preferAbsolute).
  servesInstallPage: /<title>Instalar la app/.test(home.body),
};
report.hero = hero;
say();
say('**Hero markers in the home HTML**');
if (homeUnread) {
  say(`- Not checked: ${homeUnread}.`);
  if (home.challenged) report.problems.push('Cloudflare challenged the checker on the home page, so the site could not be verified (bot protection, not a site failure)');
  else if (home.status > 0 && home.status < 500) report.problems.push(`/ answered ${home.status}`);
} else {
  say(`- Scene system present (data-elevari-scene): ${hero.sceneInitScript ? 'yes' : 'NO'}`);
  say(`- Día · Tarde · Noche switcher present: ${hero.sceneSwitcher ? 'yes' : 'NO'}`);
  say(`- It is the home page: ${hero.servesInstallPage ? 'NO, it is the /app install page' : 'yes'}`);
  if (!hero.sceneInitScript) report.problems.push('The home HTML does not contain the scene system: the old hero is still being served');
  if (hero.servesInstallPage) report.problems.push('The home page (/) is serving the /app install page');
}

const appPage = pages['/app'];
report.install = {
  pageRenders: appPage.body.includes('Instalar la app'),
  downloadButton: /Descargar (para Android|el APK)/.test(appPage.body),
  comingSoon: appPage.body.includes('Disponible muy pronto'),
};
say();
say('**Install page (/app)**');
say(
  unread(appPage)
    ? `- Not checked: ${unread(appPage)}.`
    : `- Renders: ${report.install.pageRenders ? 'yes' : 'NO'}; APK button: ${report.install.downloadButton ? 'yes' : 'not yet'}; "Disponible muy pronto": ${report.install.comingSoon ? 'shown' : 'no'}`,
);

// Is Turnstile enforced? One login with a made-up account and no challenge token.
const loginPage = pages['/auth/login'];
const widgetInHtml = /challenges\.cloudflare\.com|cf-turnstile|turnstile/i.test(loginPage.body);
const login = await request('/api/v1/auth/login', {
  headers: { 'content-type': 'application/json', accept: 'application/json' },
  body: JSON.stringify({ email: 'site-check@example.invalid', password: 'not-a-real-password-1' }),
});
let loginCode = login.error ? `request_error: ${login.error.slice(0, 80)}` : null;
try {
  const json = JSON.parse(login.body);
  if (typeof json?.code === 'string') loginCode = json.code;
} catch {
  // Not JSON (an HTML error or challenge page): there is no code to read.
}
const apiProbe = { status: login.status, code: loginCode };
const enforced = apiProbe.code === 'turnstile_failed';
report.turnstile = { widgetInLoginHtml: widgetInHtml, apiStatus: apiProbe.status, apiCode: apiProbe.code, enforcedForNativeApps: enforced };
say();
say('**Turnstile (decides whether the Android app can sign in without API_CLIENT_KEY)**');
say(unread(loginPage) ? `- Login page not checked: ${unread(loginPage)}.` : `- Widget referenced by the login page: ${widgetInHtml ? 'yes' : 'no'}`);
say(`- Login without a challenge token: HTTP ${apiProbe.status}, code \`${apiProbe.code ?? 'none'}\``);
say(
  enforced
    ? '- Result: ENFORCED. The app needs API_CLIENT_KEY on the server and the same value in the EXPO_PUBLIC_API_KEY repository secret, or app sign-in fails.'
    : apiProbe.status === 401 || apiProbe.status === 429
      ? '- Result: NOT enforced for this request. The app can sign in without a key.'
      : login.challenged
        ? '- Result: inconclusive. Cloudflare challenged the request before it reached the API.'
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

// Cloudflare can answer a navigation with its challenge page. A real browser usually clears it by itself
// in a few seconds and is sent on to the page; if it does not, the screenshot shows the check, not the site.
const SHOWS_CHECK = " — shows Cloudflare's check, not the page";
const isChallenge = (response) => response?.headers()['cf-mitigated'] === 'challenge';
async function open(page, path) {
  const response = await page.goto(`${base}${path}`, { waitUntil: 'load', timeout: 45_000 }).catch(() => null);
  if (!isChallenge(response)) return response;
  const isPageLoad = (res) => res.request().isNavigationRequest() && res.frame() === page.mainFrame();
  const cleared = await page.waitForResponse((res) => isPageLoad(res) && !isChallenge(res), { timeout: 20_000 }).catch(() => null);
  if (cleared) await page.waitForLoadState('load').catch(() => {});
  return cleared ?? response;
}

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

  const response = await open(page, '/');
  await page.waitForTimeout(2500);
  const title = await page.title();
  const homeNote = isChallenge(response) ? SHOWS_CHECK : '';
  if (!homeNote && (!response || response.status() >= 400 || /just a moment|attention required/i.test(title))) {
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
    say(`- ${file} (${label})${homeNote}`);
  }

  if (vp.name === 'desktop') {
    await page.screenshot({ path: `${out}/home-desktop-full.png`, fullPage: true });
    report.screenshots.push('home-desktop-full.png');
    say(`- home-desktop-full.png (full page)${homeNote}`);
  }

  for (const [path, name] of [
    ['/app', 'install'],
    ['/auth/login', 'login'],
  ]) {
    const pageResponse = await open(page, path);
    await page.waitForTimeout(1500);
    const file = `${name}-${vp.name}.png`;
    await page.screenshot({ path: `${out}/${file}` });
    report.screenshots.push(file);
    say(`- ${file}${isChallenge(pageResponse) ? SHOWS_CHECK : ''}`);
  }

  const unique = [...new Set(errors)].slice(0, 8);
  report[`${vp.name}Errors`] = unique;
  say(unique.length ? `- ${vp.name} browser errors: ${unique.join(' | ')}` : `- ${vp.name}: no browser errors`);
  await ctx.close();
}
await browser.close();

say();
say(report.problems.length ? `**Problems:** ${report.problems.join('; ')}` : '**No problems found.**');
// Shown on the run page, so the reason is visible without opening the log.
if (process.env.GITHUB_ACTIONS && report.problems.length) console.log(`::error title=Live site check::${report.problems.join('; ')}`);

writeFileSync(`${out}/report.json`, JSON.stringify(report, null, 2));
writeFileSync(`${out}/summary.md`, `${lines.join('\n')}\n`);
if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, `${lines.join('\n')}\n`);
if (report.problems.length) process.exitCode = 1;
