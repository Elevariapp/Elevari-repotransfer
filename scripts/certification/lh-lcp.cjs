const fs = require('node:fs');
const path = require('node:path');
const j = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'docs', 'reports', 'assets', 'lighthouse-home.json'), 'utf8'));
const ids = Object.keys(j.audits).filter((id) => id.includes('lcp') || id.includes('largest'));
for (const id of ids) {
  const a = j.audits[id];
  console.log('\n==', id, '| score:', a.score, '|', a.displayValue || '');
  const items = a.details?.items;
  if (items) console.log(JSON.stringify(items).slice(0, 900));
}
