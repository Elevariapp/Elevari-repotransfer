const fs = require('node:fs');
const path = require('node:path');
const j = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'docs', 'reports', 'assets', process.argv[2]), 'utf8'));
for (const id of ['largest-contentful-paint-element', 'lcp-discovery-insight', 'image-delivery-insight', 'render-blocking-insight']) {
  const a = j.audits[id];
  if (!a) continue;
  console.log('\n=== ' + id + ' ===');
  console.log('score:', a.score, '| display:', a.displayValue || '');
  const items = a.details?.items ?? [];
  for (const item of items.slice(0, 6)) {
    console.log(JSON.stringify(item).slice(0, 600));
  }
  if (a.details?.items?.[0]?.items) {
    for (const sub of a.details.items[0].items.slice(0, 6)) console.log('  sub:', JSON.stringify(sub).slice(0, 400));
  }
}
