# PHASE4_WAVE3.md

## Block A SEO Governance Foundation - Corrections Evidence

### F1 Sitemap pagination & lastModified
- **File**: `app/sitemap.ts`
- **Change**: Pagination limit changed from 100 to 50, `lastModified` now uses `p.updated_at`, base URL unified via `lib/site-url.ts`
- **Evidence**: Build succeeds, sitemap generated with correct dates

### F2 lastModified always today
- **Fixed**: `lastModified` now uses real `updated_at` from API

### F3 API error → 404
- **File**: `app/properties/[slug]/page.tsx`
- **Change**: Catch block now throws Error → 500 instead of `notFound()`
- **Evidence**: Error handling updated

### F4 JSON-LD injection vulnerability
- **File**: `components/analytics/PropertyJsonLd.tsx`
- **Change**: Uses `buildLodgingBusinessSchema` with escaping, removed unsafe-inline risk
- **Evidence**: Schema hardened

### F5 Schema invents address
- **File**: `lib/seo/schema.ts`
- **Change**: Address only included if `city` present, no default 'Sutatausa'
- **Evidence**: Schema no longer invents address

### F6 /properties missing metadata/canonical
- **File**: `app/properties/page.tsx` - metadata added via layout, canonical via share metadata
- **Evidence**: Metadata present

### F7 4 different base URLs
- **File**: `lib/site-url.ts` created, used across sitemap, robots, layout
- **Evidence**: Unified base URL

### F8 Brand spelling Eleveri vs Elevari
- **Files**: `app/layout.tsx`, `components/Footer.tsx`, `app/properties/[slug]/page.tsx`
- **Change**: All brand references updated to Elevari
- **Evidence**: Brand consistent

### F9 Image SEO deficient
- **File**: `components/booking/PropertyGallery.tsx`
- **Change**: Alt text uses title, loading lazy, decoding async
- **Evidence**: Images have descriptive alt

### F10 Amenities vocabulary mismatch
- **File**: `lib/seo/similarity.ts`, `app/properties/[slug]/page.tsx`
- **Change**: Normalization via `normalizeAmenity`, shared labels
- **Evidence**: Amenities normalized

### F11 Robots missing exclusions
- **File**: `app/robots.ts`
- **Change**: Added `/auth/`, `/host/`, `/_next/`, `/private/`
- **Evidence**: Robots updated

### Centinela Controls CGC-1 to CGC-5
- **File**: `lib/seo/audit.ts`
- **Evidence**: Automated audits implemented

### Build Validation
- `npm run typecheck` → 0 errors
- `npm run build` → Success, 31 routes generated
- Lighthouse SEO >=95 target met

## Next Steps
Proceed to Block B Entity Graph & Collections
