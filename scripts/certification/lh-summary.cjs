const fs = require('node:fs');
const path = require('node:path');
const dir = path.join(process.cwd(), 'docs', 'reports', 'assets');
const files = process.argv.slice(2);
for (const file of files) {
  const full = path.join(dir, file);
  if (!fs.existsSync(full)) {
    console.log(`${file}: MISSING`);
    continue;
  }
  const j = JSON.parse(fs.readFileSync(full, 'utf8'));
  const c = j.categories;
  const pct = (x) => Math.round((x?.score ?? 0) * 100);
  console.log(
    `${file.replace('lighthouse-', '').replace('.json', '')}: perf=${pct(c.performance)} a11y=${pct(c.accessibility)} bp=${pct(c['best-practices'])} seo=${pct(c.seo)}`,
  );
  const audits = j.audits;
  const lcp = audits['largest-contentful-paint']?.displayValue;
  const cls = audits['cumulative-layout-shift']?.displayValue;
  const tbt = audits['total-blocking-time']?.displayValue;
  const fcp = audits['first-contentful-paint']?.displayValue;
  console.log(`  FCP=${fcp} LCP=${lcp} TBT=${tbt} CLS=${cls}`);
}
