#!/usr/bin/env node
// Fails the build when two different page files are bound to the same module in `.next/server/app`.
//
// That is how `/` once served the /app install page in production: webpack resolved the root page path to another
// route's file, `next build` stayed green and the deploy looked fine. Run it right after `next build --webpack`.
// Usage: node scripts/check-route-modules.mjs [.next/server/app]
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const appDir = process.argv[2] ?? '.next/server/app';
const pageBinding = /page:\[\(\)=>Promise\.resolve\(\)\.then\(c\.bind\(c,(\d+)\)\),"([^"]+)"\]/g;

function* pageEntries(dir) {
  for (const item of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, item.name);
    if (item.isDirectory()) yield* pageEntries(full);
    else if (item.name === 'page.js') yield full;
  }
}

const filesByModule = new Map();
let bindings = 0;
for (const entry of pageEntries(appDir)) {
  for (const [, moduleId, file] of readFileSync(entry, 'utf8').matchAll(pageBinding)) {
    bindings += 1;
    if (!filesByModule.has(moduleId)) filesByModule.set(moduleId, new Set());
    filesByModule.get(moduleId).add(file);
  }
}

if (bindings === 0) {
  // The compiled output changed shape (Next upgrade): do not block deploys, but say so.
  console.warn(`check-route-modules: no page bindings found under ${appDir}; check skipped`);
  process.exit(0);
}

const collisions = [...filesByModule].filter(([, files]) => files.size > 1);
if (collisions.length > 0) {
  for (const [moduleId, files] of collisions) {
    console.error(`check-route-modules: module ${moduleId} is bound to different pages: ${[...files].join(', ')}`);
  }
  process.exit(1);
}

console.log(`check-route-modules: ${bindings} page bindings, ${filesByModule.size} modules, no collisions`);
