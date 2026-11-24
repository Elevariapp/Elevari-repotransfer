// Looks at the PUBLIC site the way a visitor does: status codes, the hero markers, whether Cloudflare Turnstile
// is enforced on the API (read from the public /health), and screenshots of the home hero (Día / Tarde / Noche) on
// desktop and phone.
// Run by .github/workflows/site-check.yml. It only sends GET requests to public pages and needs no credentials.
//
// Cloudflare fronts the site and can answer 403 to GitHub-hosted runners (it did for Node's fetch and for headless
// Chromium). So every request goes through plain curl, and the browser only renders the responses curl fetched:
// what the screenshots show is exactly what production sent. If Cloudflare blocks curl too, the run says so and stops
// without a verdict about the site, because a block page says nothing about the hero.
//
// Env: BASE_URL (default https://elevari.live), OUT_DIR (default site-check), PW_DIR (folder with `playwright` installed),
// CHROME_PATH (optional: use this Chrome instead of Playwright's own, for local runs).
import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { appendFileSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

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

const report = { base, at: new Date().toISOString(), blocked: false, pages: [], turnstile: null, screenshots: [], problems: [] };
const lines = [];
const say = (text = '') => {
  console.log(text);
  lines.push(text);
};

const scratch = mkdtempSync(join(tmpdir(), 'site-check-'));
let sequence = 0;

/** One request with curl. Returns the final response; status 0 means curl itself failed. */
function curl(url, { method = 'GET', headers = {}, body } = {}) {
  const id = (sequence += 1);
  const headerFile = join(scratch, `${id}.headers`);
  const bodyFile = join(scratch, `${id}.body`);
  const args = ['-sS', '--max-time', '30', '--compressed', '-X', method, '-D', headerFile, '-o', bodyFile];
  for (const [name, value] of Object.entries(headers)) args.push('-H', `${name}: ${value}`);
  if (body !== undefined) args.push('--data-binary', '@-');
  args.push(url);

  const run = spawnSync('curl', args, { input: body, maxBuffer: 128 * 1024 * 1024 });
  if (run.status !== 0) {
    return { status: 0, headers: {}, body: Buffer.alloc(0), error: String(run.stderr).trim().slice(0, 120) };
  }
  const blocks = readFileSync(headerFile, 'latin1').split(/\r?\n\r?\n/).filter(Boolean);
  const headerLines = (blocks.at(-1) ?? '').split(/\r?\n/);
  const status = Number(/^HTTP\/\S+ (\d{3})/.exec(headerLines[0] ?? '')?.[1] ?? 0);
  const responseHeaders = {};
  for (const line of headerLines.slice(1)) {
    const colon = line.indexOf(':');
    if (colon > 0) responseHeaders[line.slice(0, colon).trim().toLowerCase()] = line.slice(colon + 1).trim();
  }
  const payload = readFileSync(bodyFile);
  rmSync(headerFile, { force: true });
  rmSync(bodyFile, { force: true });
  return { status, headers: responseHeaders, body: payload };
}

/** True for Cloudflare's own block or challenge pages (as opposed to an answer from our app). */
function isCloudflareBlock(res) {
  if (![403, 429, 503].includes(res.status)) return false;
  if (res.headers['cf-mitigated']) return true;
  return /just a moment|attention required|sorry, you have been blocked|cf-error-details|cf-chl/i.test(
    res.body.subarray(0, 30_000).toString('utf8'),
  );
}

function probePage(path) {
  const started = Date.now();
  const res = curl(`${base}${path}`, { headers: { 'user-agent': UA, accept: 'text/html,application/xhtml+xml,*/*;q=0.8' } });
  return {
    path,
    status: res.status,
    ms: Date.now() - started,
    bytes: res.body.length,
    location: res.headers.location ?? null,
    cache: res.headers['cf-cache-status'] ?? null,
    blocked: isCloudflareBlock(res),
    error: res.error,
    title: /<title[^>]*>([^<]*)<\/title>/i.exec(res.body.subarray(0, 60_000).toString('utf8'))?.[1] ?? null,
    headers: Object.fromEntries(Object.entries(res.headers).filter(([name]) => name !== 'set-cookie')),
    body: res.body.toString('utf8'),
  };
}

const staticAssets = new Map();

/** Makes the browser context render what curl fetches for the site's own origin. */
async function serveThroughCurl(ctx) {
  await ctx.route(`${base}/**`, async (route) => {
    const request = route.request();
    if (request.method() !== 'GET') return route.continue();
    const url = request.url();
    const cacheable = new URL(url).pathname.startsWith('/_next/static/');
    let res = cacheable ? staticAssets.get(url) : undefined;
    if (!res) {
      const sent = request.headers();
      res = curl(url, {
        headers: { 'user-agent': sent['user-agent'] ?? UA, accept: sent.accept ?? '*/*', 'accept-language': 'es-CO,es;q=0.9' },
      });
      if (cacheable && res.status === 200) staticAssets.set(url, res);
    }
    if (res.status === 0) return route.abort('failed');
    const headers = {};
    for (const [name, value] of Object.entries(res.headers)) {
      // curl already decoded the body and Playwright recomputes the length.
      if (!['content-encoding', 'content-length', 'transfer-encoding', 'connection', 'set-cookie'].includes(name)) headers[name] = value;
    }
    return route.fulfill({ status: res.status, headers, body: res.body });
  });
}

function finish(exitCode) {
  writeFileSync(`${out}/report.json`, JSON.stringify(report, null, 2));
  writeFileSync(`${out}/summary.md`, `${lines.join('\n')}\n`);
  if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, `${lines.join('\n')}\n`);
  rmSync(scratch, { recursive: true, force: true });
  process.exit(exitCode);
}

say(`## Live site check: ${base}`);
say(`Run at ${report.at}`);
say();
say('| Page | Status | Time | Size |');
say('| --- | --- | --- | --- |');

const paths = ['/', '/properties', '/app', '/auth/login', '/auth/register', '/auth/forgot-password', '/legal/faq', '/robots.txt', '/health', '/bot/health'];
const bodies = {};
for (const path of paths) {
  const page = probePage(path);
  bodies[path] = page.body;
  const { body, ...rest } = page;
  report.pages.push(rest);
  // Public HTML, kept in the artifact so a surprising page can be read instead of guessed at.
  mkdirSync(`${out}/raw`, { recursive: true });
  writeFileSync(`${out}/raw/${path === '/' ? 'home' : path.slice(1).replaceAll('/', '_')}.html`, page.body);
  say(
    `| \`${path}\` | ${page.status || 'error'}${page.blocked ? ' (Cloudflare block page)' : ''}${page.location ? ` → ${page.location}` : ''} | ${page.ms} ms | ${Math.round(page.bytes / 1024)} KB |`,
  );
}

if (report.pages.find((page) => page.path === '/')?.blocked) {
  const blockedCount = report.pages.filter((page) => page.blocked).length;
  report.blocked = true;
  say();
  say('**BLOCKED BY CLOUDFLARE: this run could not see the site.**');
  say(
    `Cloudflare answered its own block page to GitHub's runner (${blockedCount} of ${report.pages.length} requests), so none of this says anything about the hero, the install page or Turnstile. ` +
      'To check the live site from GitHub, Cloudflare needs a WAF custom rule that skips bot protection for these requests. Until then, open the site in a browser and hard-refresh (Ctrl+Shift+R).',
  );
  finish(3);
}

for (const page of report.pages) {
  if (page.blocked) continue;
  if (page.status !== 200) report.problems.push(`${page.path} answered ${page.status || page.error} (expected 200)`);
}

const homeStatus = report.pages.find((page) => page.path === '/')?.status ?? 0;
const home = homeStatus === 200 ? bodies['/'] : '';
const hero = {
  readable: homeStatus === 200,
  // data-elevari-scene is also in the root layout, so every page has it; the switcher exists only in the home hero.
  sceneInitScript: home.includes('data-elevari-scene'),
  sceneSwitcher: home.includes('sc-sw') && home.includes('data-scene="night"'),
  title: report.pages.find((page) => page.path === '/')?.title ?? null,
};
report.hero = hero;
say();
say('**Hero markers in the home HTML**');
if (!hero.readable) {
  say(`- Could not read the home page (HTTP ${homeStatus || 'error'}), so nothing can be said about the hero.`);
} else {
  say(`- Page title: ${hero.title ?? 'none'}`);
  say(`- Scene system in the layout (data-elevari-scene): ${hero.sceneInitScript ? 'yes' : 'NO'}`);
  say(`- Día · Tarde · Noche hero in the home page: ${hero.sceneSwitcher ? 'yes' : 'NO'}`);
  if (!hero.sceneSwitcher) report.problems.push('The home page does not contain the Día · Tarde · Noche hero: the new hero is NOT what visitors get');
  if (!hero.sceneInitScript) report.problems.push('No page carries the scene system: the new build is not live');
}

const appStatus = report.pages.find((page) => page.path === '/app')?.status ?? 0;
const appPage = appStatus === 200 ? bodies['/app'] : '';
report.install = {
  readable: appStatus === 200,
  pageRenders: appPage.includes('Instalar la app'),
  downloadButton: /Descargar (para Android|el APK)/.test(appPage),
  comingSoon: appPage.includes('Disponible muy pronto'),
};
say();
say('**Install page (/app)**');
say(
  report.install.readable
    ? `- Renders: ${report.install.pageRenders ? 'yes' : 'NO'}; APK button: ${report.install.downloadButton ? 'yes' : 'not yet'}; "Disponible muy pronto": ${report.install.comingSoon ? 'shown' : 'no'}`
    : `- Could not read the page (HTTP ${appStatus || 'error'}).`,
);

// Is Turnstile enforced? The API reports it in /health (turnstile_required), which nginx exposes publicly.
const loginHtml = bodies['/auth/login'] || '';
const widgetInHtml = /challenges\.cloudflare\.com|cf-turnstile|turnstile/i.test(loginHtml);
let health = null;
try {
  const json = JSON.parse(bodies['/health'] || '');
  if (json && typeof json === 'object' && 'turnstile_required' in json) health = json;
} catch {
  // not the API's JSON (for example a block page or a 404)
}
report.turnstile = {
  widgetInLoginHtml: widgetInHtml,
  apiStatus: health?.status ?? null,
  database: health?.database ?? null,
  enforced: typeof health?.turnstile_required === 'boolean' ? health.turnstile_required : null,
};
say();
say('**API health and Turnstile (decides whether the Android app can sign in without API_CLIENT_KEY)**');
say(`- /health: ${health ? `status \`${health.status}\`, database \`${health.database}\`, turnstile_required \`${health.turnstile_required}\`` : 'did not return the API health JSON'}`);
say(`- Widget referenced by the login page: ${widgetInHtml ? 'yes' : 'no'}`);
say(
  report.turnstile.enforced === true
    ? '- Result: ENFORCED. The app needs API_CLIENT_KEY on the server and the same value in the EXPO_PUBLIC_API_KEY repository secret, or app sign-in and registration fail with turnstile_failed.'
    : report.turnstile.enforced === false
      ? '- Result: NOT enforced. The app can sign in without a key.'
      : '- Result: unknown (/health did not answer with the API JSON).',
);
if (health && health.status !== 'ok') report.problems.push(`API /health reports status ${health.status}, database ${health.database}`);

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
    serviceWorkers: 'block',
  });
  await serveThroughCurl(ctx);
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (error) => errors.push(`pageerror: ${String(error).slice(0, 140)}`));
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(`console: ${msg.text().slice(0, 140)}`);
  });

  const response = await page.goto(`${base}/`, { waitUntil: 'load', timeout: 45_000 }).catch(() => null);
  await page.waitForTimeout(2500);
  const title = await page.title();
  report[`${vp.name}HomeLanded`] = { url: page.url(), title, status: response?.status() ?? null };
  say(`- ${vp.name}: opening / landed on ${page.url()} (title "${title}")`);
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
finish(report.problems.length ? 1 : 0);
