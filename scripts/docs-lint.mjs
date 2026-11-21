#!/usr/bin/env node
// Lint de documentación: falla si aparecen términos obsoletos/prohibidos o datos sensibles.
// El repositorio es público: los datos sensibles se detectan por hash SHA-256 para no
// escribirlos aquí. Los valores reales viven en docs/HANDOVER.private.md (gitignored).
import { createHash } from 'node:crypto';
import { readdirSync, readFileSync, statSync, existsSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(fileURLToPath(new URL('.', import.meta.url)), '..');

const skipDirs = ['docs/archive', 'docs/reports'];
const privateFile = 'docs/HANDOVER.private.md';

const norm = (p) => p.split(sep).join('/');
const isUnder = (rel, dirs) => dirs.some((d) => rel === d || rel.startsWith(`${d}/`));

function walk(dir, recursive, accept) {
  const out = [];
  if (!existsSync(dir)) return out;
  for (const name of readdirSync(dir)) {
    if (name === 'node_modules' || name === '.git') continue;
    const full = join(dir, name);
    const rel = norm(relative(root, full));
    if (rel === privateFile) continue;
    const st = statSync(full);
    if (st.isDirectory()) {
      if (recursive) out.push(...walk(full, true, accept));
    } else if (accept(rel)) {
      out.push(full);
    }
  }
  return out;
}

const isMd = (rel) => rel.toLowerCase().endsWith('.md');

// Documentación canónica (términos obsoletos + sensibles).
const canonical = [
  ...walk(root, false, (r) => isMd(r)),
  ...walk(join(root, 'deploy'), false, isMd),
  ...walk(join(root, 'docs'), false, (r) => isMd(r)),
  ...walk(join(root, 'mobile'), false, isMd),
  ...walk(join(root, 'knowledge'), true, isMd),
].filter((f) => !isUnder(norm(relative(root, f)), skipDirs));

// Solo datos sensibles: todo lo versionado bajo docs/ salvo docs/archive (solo archivos de texto).
const textExt = /\.(md|txt|json|ya?ml|csv|sh|conf|html|mjs|js|ts)$/i;
const docsAll = walk(join(root, 'docs'), true, (r) => !isUnder(r, ['docs/archive']) && textExt.test(r));

const canonicalSet = new Set(canonical);
const sensitiveFiles = [...new Set([...canonical, ...docsAll])];

const legacyTerms = [/AWS EC2/i, /Vercel/i, /Supabase/i, /Netlify/i, /Droplet/i, /DigitalOcean/i];
const forbidden = [
  /eleveri/i,
  /wana\.co/i,
  /\b(soporte|privacidad|legal|moderacion|accesibilidad|anfitriones|reservas|notificaciones)@elevari\.live/i,
];
const wana = /wan[aá]/i;
const wanaOk = /glamping[ -]wan[aá]/i;
const decisionLine = /descartad|discarded/i;

const sha = (s) => createHash('sha256').update(s).digest('hex');
// Nombres que no deben aparecer (se compara el hash de cada palabra en minúsculas).
const bannedWordHashes = new Set([
  '4fc25f400af2544ad3bdaf0df75d109999635dee842fbf52f31ec6d3fe3f77e8',
]);

const privateIp = /^(10\.|127\.|0\.0\.0\.0$|192\.168\.|172\.(1[6-9]|2\d|3[01])\.|203\.0\.113\.|198\.51\.100\.|192\.0\.2\.)/;

// Reglas genéricas: nunca escribir IPs públicas, ids hex de 32 caracteres (Cloudflare, Web Analytics),
// UUID, ids numéricos largos (Hetzner) ni huellas SSH. Usar placeholders (<SERVER_IP>, <CF_ACCOUNT_ID>, ...).
function sensitiveKind(line, strict) {
  for (const m of strict ? line.matchAll(/\b\d{1,3}(?:\.\d{1,3}){3}\b/g) : []) {
    if (!privateIp.test(m[0])) return 'IP pública';
  }
  if (/\b[0-9a-f]{32}\b/i.test(line)) return 'id hex de 32 caracteres';
  if (/\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/i.test(line)) return 'UUID';
  if (strict && /\b\d{9,}\b/.test(line)) return 'id numérico largo';
  if (/SHA256:[A-Za-z0-9+/=]{40,}/.test(line)) return 'huella SSH';
  for (const m of line.matchAll(/[A-Za-z]{4,}/g)) {
    if (bannedWordHashes.has(sha(m[0].toLowerCase()))) return 'nombre prohibido';
  }
  return null;
}

const problems = [];
for (const file of sensitiveFiles) {
  const rel = norm(relative(root, file));
  const lines = readFileSync(file, 'utf8').split(/\r?\n/);
  const isCanonical = canonicalSet.has(file);
  lines.forEach((line, i) => {
    const where = `${rel}:${i + 1}`;
    const kind = sensitiveKind(line, file.toLowerCase().endsWith('.md'));
    if (kind) problems.push(`${where}  dato sensible (repo público): ${kind}; usar placeholder`);
    if (!isCanonical) return;
    for (const re of forbidden) {
      if (re.test(line)) problems.push(`${where}  prohibido ${re}  -> ${line.trim().slice(0, 100)}`);
    }
    if (!decisionLine.test(line)) {
      for (const re of legacyTerms) {
        if (re.test(line)) problems.push(`${where}  obsoleto ${re}  -> ${line.trim().slice(0, 100)}`);
      }
    }
    if (wana.test(line) && !wanaOk.test(line)) {
      problems.push(`${where}  marca 'wana' fuera de 'Glamping Waná'  -> ${line.trim().slice(0, 100)}`);
    }
  });
}

if (problems.length > 0) {
  console.error(`docs:lint FALLÓ (${problems.length} problema(s)):`);
  for (const p of problems) console.error(`  ${p}`);
  process.exit(1);
}
console.log(`docs:lint OK (${sensitiveFiles.length} archivos revisados)`);
