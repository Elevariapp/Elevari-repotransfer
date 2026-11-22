# PHASE 4 · WAVE 1 — Discovery & Trust

**Estado:** ejecutado y validado
**Línea base:** Foundation Reboot certificado (no se reabre)

---

## 1. Objetivo

Mejorar **descubrimiento** (encontrar el espacio correcto) y **confianza en el precio** (saber cuánto se pagará), sin tocar la base certificada de pagos, auth ni diseño.

## 2. Alcance entregado

| Capacidad | Antes | Ahora |
|-----------|-------|-------|
| Ordenar resultados | No existía | 5 criterios (recomendados, precio ↑/↓, más reservados, novedades) |
| Filtrar por precio | No existía | 4 presets + rango min/max |
| Filtrar por comodidades | No existía | WiFi, fogata, vista, estacionamiento (multi-selección) |
| Paginación | Límite fijo 24 sin control | “Cargar más” + contador “Mostrando X–Y de Z” |
| Estado compartible | Parcial | URL canónica con todos los filtros |
| Precio en detalle | Solo “/noche” en el widget | Bloque “Precio y transparencia” + políticas de estancia |
| Medición | 8 eventos | + `filter_applied`, `sort_applied`, `catalog_viewed` |

## 3. Cambios técnicos

| Archivo | Cambio |
|---------|--------|
| `lib/catalog-params.ts` | **Nuevo** contrato puro: parseo/sanitización, URL canónica, toggle de filtros, presets, conteo y paginación |
| `api/src/routes/properties.ts` | `sort`, `min_price`, `max_price`, `amenities`, `total` en `meta`; `orderBy` tipado y `count` en paralelo |
| `lib/api-client.ts` | Tipos del contrato y parámetros nuevos |
| `app/properties/page.tsx` | Parseo del contrato, filtros siempre visibles, contador, paginación y estados vacío/error |
| `components/catalog/CatalogFilters.tsx` | **Nuevo** — orden (select etiquetado), chips de precio y comodidades con `aria-pressed`, “Limpiar”, estado `aria-live` |
| `components/catalog/CatalogPagination.tsx` | **Nuevo** — paginación server-rendered (funciona sin JS, crawlable) |
| `components/catalog/CatalogViewTracker.tsx` | **Nuevo** — `catalog_viewed` deduplicado por firma |
| `app/properties/[slug]/page.tsx` | Bloque de precio transparente + sección “Políticas de la estancia” |
| `lib/analytics.ts` | 3 eventos nuevos |

### Decisiones de diseño

- **Filtros en URL**: cada combinación es compartible e indexable; el botón “atrás” funciona.
- **Chips con `aria-pressed`** en lugar de checkboxes ocultos: mismo estado accesible con menos DOM.
- **Paginación por enlace** (no scroll infinito): accesible con teclado y compatible con lectores de pantalla.
- **Sanitización en un único módulo**: la API nunca recibe valores no validados (`sort` whitelist, precios enteros, fechas ISO, amenities conocidas, límites acotados).
- **`popular` = más reservados** (no “mejor valorados”) para no prometer un orden que el modelo no calcula.

## 4. Evidencia

| Prueba | Resultado |
|--------|-----------|
| `catalog-params-audit` (23 casos) | **23/23 PASS** — detectó y corrigió duplicado de amenities |
| `npm run typecheck` | 0 errores |
| `npm run build` | EXIT 0 |
| Visual (9 rutas × 7 viewports) | 63 combos · 0 overflow · 0 alt · 0 controles sin nombre |
| axe (14 ejecuciones) | **0 violaciones** (incluye filtros nuevos) |
| Lighthouse `/properties?sort=price_asc&amenities=wifi` | **99 / 100 / 100 / 100** |
| Lighthouse `/` | 85–90 / 100 / 100 / 100 (variación por carga del entorno) |

Artefactos: `docs/reports/assets/catalog-results.json`, `lighthouse-properties.json`, `visual/`.

## 5. Impacto esperado

| Valor | Efecto |
|-------|--------|
| Usuario | Encuentra por precio y comodidad sin adivinar; ve el precio total antes de pagar |
| Negocio | Menos abandono por precio inesperado; URLs de filtros permiten campañas y SEO de intención |
| Operación | Menos consultas de soporte sobre “qué incluye el precio” |
| Escalabilidad | Filtros y orden resueltos en PostgreSQL con índices existentes; paginación acota la carga |

## 6. Backlog priorizado (no ejecutado)

| Prioridad | Capacidad | Valor |
|-----------|-----------|-------|
| Alta | Job de reconciliación pagos↔reservas | Integridad financiera continua |
| Alta | OG image dinámica por propiedad | Compartibilidad en WhatsApp/redes |
| Media | Filtro por fechas visibles en el listado | Coherencia con búsqueda |
| Media | Orden por rating real (requiere agregado materializado) | Mejor descubrimiento |
| Baja | Mapa de resultados | Exploración geográfica |
