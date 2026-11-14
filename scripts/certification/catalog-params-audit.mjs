/**
 * Phase 4 — catalog contract tests (pure logic, no server required).
 * Usage: node scripts/certification/catalog-params-audit.mjs
 */
import { writeFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import {
  parseCatalogParams,
  toApiQuery,
  toCatalogHref,
  toggleAmenity,
  pricePreset,
  activeFilterCount,
  hasMore,
  DEFAULT_LIMIT,
} from '../../lib/catalog-params.ts';

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

const defaults = {
  sort: 'recommended',
  amenities: [],
  offset: 0,
  limit: DEFAULT_LIMIT,
};

check('defaults', () => parseCatalogParams({}), defaults);

check('invalid_sort_falls_back', () => parseCatalogParams({ sort: 'drop_table' }).sort, 'recommended');

check('valid_sort', () => parseCatalogParams({ sort: 'price_asc' }).sort, 'price_asc');

check(
  'amenities_filtered',
  () => parseCatalogParams({ amenities: 'WiFi, bogus, FOGATA,wifi' }).amenities,
  ['wifi', 'fogata'],
);

check('price_swap', () => {
  const p = parseCatalogParams({ min_price: '900000', max_price: '300000' });
  return [p.minPrice, p.maxPrice];
}, [300000, 900000]);

check('negative_price_ignored', () => {
  const p = parseCatalogParams({ min_price: '-5' });
  return p.minPrice ?? null;
}, null);

check('guests_out_of_range_ignored', () => parseCatalogParams({ guests: '99' }).guests ?? null, null);

check('guests_valid', () => parseCatalogParams({ guests: '4' }).guests, 4);

check('invalid_date_dropped', () => parseCatalogParams({ check_in: '13/11/2026' }).checkIn ?? null, null);

check('valid_dates', () => {
  const p = parseCatalogParams({ check_in: '2026-12-01', check_out: '2026-12-04' });
  return [p.checkIn, p.checkOut];
}, ['2026-12-01', '2026-12-04']);

check('limit_over_max_falls_back', () => parseCatalogParams({ limit: '999' }).limit, DEFAULT_LIMIT);

check('offset_kept', () => parseCatalogParams({ offset: '48' }).offset, 48);

check('api_query_omits_defaults', () => toApiQuery(parseCatalogParams({ sort: 'recommended' })).toString(), '');

check(
  'api_query_includes_filters',
  () => toApiQuery(parseCatalogParams({ city: 'Sutatausa', sort: 'price_desc', amenities: 'wifi', min_price: '300000' })).toString(),
  'city=Sutatausa&sort=price_desc&min_price=300000&amenities=wifi',
);

check('href_roundtrip', () => {
  const p = parseCatalogParams({ city: 'Cucunubá', guests: '2', sort: 'popular', amenities: 'vista', offset: '24' });
  const href = toCatalogHref(p);
  const query = href.split('?')[1] ?? '';
  const reparsed = parseCatalogParams(Object.fromEntries(new URLSearchParams(query)));
  return {
    city: reparsed.city,
    guests: reparsed.guests,
    sort: reparsed.sort,
    amenities: reparsed.amenities,
    offset: reparsed.offset,
  };
}, { city: 'Cucunubá', guests: 2, sort: 'popular', amenities: ['vista'], offset: 24 });

check('href_empty_is_clean', () => toCatalogHref(parseCatalogParams({})), '/properties');

check('toggle_adds_and_resets_offset', () => {
  const p = parseCatalogParams({ offset: '24' });
  const next = toggleAmenity(p, 'wifi');
  return [next.amenities, next.offset];
}, [['wifi'], 0]);

check('toggle_removes', () => {
  const p = parseCatalogParams({ amenities: 'wifi,fogata' });
  return toggleAmenity(p, 'wifi').amenities;
}, ['fogata']);

check('price_preset_match', () => pricePreset(parseCatalogParams({ min_price: '300000', max_price: '600000' })), '300-600');

check('price_preset_none', () => pricePreset(parseCatalogParams({ min_price: '123456' })), 'any');

check('active_filters_count', () => {
  const p = parseCatalogParams({ city: 'Sutatausa', guests: '2', amenities: 'wifi,fogata', sort: 'price_asc' });
  return activeFilterCount(p);
}, 5);

check('has_more_with_total', () => hasMore(parseCatalogParams({ offset: '0' }), 24, 60), true);

check('has_more_at_end', () => hasMore(parseCatalogParams({ offset: '48' }), 12, 60), false);

const report = {
  generatedAt: new Date().toISOString(),
  suite: 'catalog-params',
  cases,
  summary: { total: cases.length, pass: cases.filter((c) => c.status === 'PASS').length },
};
const outDir = join(process.cwd(), 'docs', 'reports', 'assets');
await mkdir(outDir, { recursive: true });
await writeFile(join(outDir, 'catalog-results.json'), JSON.stringify(report, null, 2));

for (const c of cases) {
  console.log(`${c.status} ${c.id}${c.status === 'FAIL' ? ' :: ' + JSON.stringify(c) : ''}`);
}
console.log(`summary: ${report.summary.pass}/${report.summary.total} pass`);
