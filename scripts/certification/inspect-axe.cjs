const r = require(require('node:path').join(process.cwd(), 'docs', 'reports', 'assets', 'a11y-results.json'));
const seen = new Map();
for (const run of r.axe) {
  for (const v of run.violations) {
    if (!seen.has(v.id)) {
      seen.set(v.id, { id: v.id, impact: v.impact, help: v.help, targets: v.targets, failure: v.failure, routes: [] });
    }
    seen.get(v.id).routes.push(`${v.route ?? ''}${run.route}@${run.viewport}`);
  }
}
console.log(JSON.stringify([...seen.values()], null, 1));
