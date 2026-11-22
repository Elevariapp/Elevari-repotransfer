/**
 * Wave 2 — shareability certification (pure metadata contract).
 * Usage: node scripts/certification/shareability-audit.mjs
 */
import { writeFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { buildPropertyShareMetadata, checkShareability, formatCopLabel, propertyLocation } from '../../lib/share-metadata.ts';

const cases = [];
function check(id, fn, expected) {
  let actual;
  let error = null;
  try {
    actual = fn();
  } catch (err) {
    error = err instanceof Error ? err.message : String(err);
  }
  const pass = error === null && JSON.stringify(actual) === JSON.stringify(expected);
  cases.push({ id, status: pass ? 'PASS' : 'FAIL', expected, actual, error });
}

const property = {
  slug: 'glamping-wana',
  title: 'Domo entre montañas',
  city: 'Sutatausa',
  country: 'CO',
  pricePerNight: 450000,
  coverImage: '/properties/glamping-wana/01-cover.jpeg',
  description: 'Un domo con vista a la montaña y cielo despejado para desconectar.',
};

const meta = buildPropertyShareMetadata(property, 'https://eleveri.app');

check('share.complete', () => checkShareability(meta), { ok: true, missing: [] });
check('share.canonical', () => meta.canonical, 'https://eleveri.app/properties/glamping-wana');
check('share.og_image_route', () => meta.openGraph.images[0]?.url, 'https://eleveri.app/properties/glamping-wana/opengraph-image');
check('share.og_size', () => [meta.openGraph.images[0]?.width, meta.openGraph.images[0]?.height], [1200, 630]);
check('share.twitter_card', () => meta.twitter.card, 'summary_large_image');
check('share.title_has_location', () => meta.title, 'Domo entre montañas · Sutatausa, Colombia');
check('share.locale', () => meta.openGraph.locale, 'es_CO');
check('share.site_name', () => meta.openGraph.siteName, 'Elevari');

check('fallback_price_label', () => formatCopLabel(450000), '$450.000 COP');
check('fallback_no_price', () => formatCopLabel(null), null);
check('fallback_location_default', () => propertyLocation({ slug: 'x', title: 'X' }), '');

const noDesc = buildPropertyShareMetadata({ ...property, description: null }, 'https://eleveri.app');
check('fallback_description_with_price', () => noDesc.description.includes('desde'), true);
check('fallback_still_shareable', () => checkShareability(noDesc).ok, true);

check('validator_detects_missing', () => {
  const broken = JSON.parse(JSON.stringify(meta));
  delete broken.openGraph.images;
  delete broken.twitter.card;
  return checkShareability(broken).missing;
}, ['og:image', 'og:image:alt', 'twitter:card']);

const report = {
  generatedAt: new Date().toISOString(),
  suite: 'shareability',
  cases,
  summary: { total: cases.length, pass: cases.filter((c) => c.status === 'PASS').length },
};
const outDir = join(process.cwd(), 'docs', 'reports', 'assets');
await mkdir(outDir, { recursive: true });
await writeFile(join(outDir, 'shareability-results.json'), JSON.stringify(report, null, 2));
for (const c of cases) console.log(`${c.status} ${c.id}${c.status === 'FAIL' ? ' :: ' + JSON.stringify(c) : ''}`);
console.log(`summary: ${report.summary.pass}/${report.summary.total} pass`);
