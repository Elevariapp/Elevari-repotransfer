const fs = require('node:fs');
const path = require('node:path');
const dir = path.join(process.cwd(), 'docs', 'reports', 'assets');
const file = process.argv[2];
const category = process.argv[3] || 'performance';
const j = JSON.parse(fs.readFileSync(path.join(dir, file), 'utf8'));
const refs = j.categories[category]?.auditRefs ?? [];
for (const ref of refs) {
  const a = j.audits[ref.id];
  if (!a) continue;
  const score = a.score === null ? 'n/a' : Math.round(a.score * 100);
  if (a.score !== null && a.score < 1) {
    console.log(`${ref.id} | score=${score} | ${a.displayValue ?? ''} | ${a.title}`);
  }
}
