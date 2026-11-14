# PHASE 0 · WS7 — SCALABILITY / CAPACITY CERTIFICATION

**Fecha:** 2026-11-13 · **Modo:** modelo de capacidad (sin load testing: no hay runtime ni k6/artillery instalados)

## Estado

**NO EJECUTADO.** No se realizaron pruebas de carga a 100/500/1.000/5.000/10.000 usuarios porque el entorno no dispone de Docker, base de datos ni endpoint desplegado. Presentar cifras inventadas sería una certificación falsa.

## Modelo de capacidad (base para la prueba real)

### Supuestos

| Variable | Valor usado |
|----------|-------------|
| Usuarios concurrentes pico | 100 / 500 / 1.000 / 5.000 / 10.000 |
| Requests por sesión | 25 (home, listado, detalle, quote, checkout) |
| Duración media de sesión | 6 min |
| Ratio lectura/escritura | 90 / 10 |
| Tamaño medio de respuesta | 40 KB HTML + 250 KB imágenes (CDN) |

### Estimación de RPS

`RPS = concurrentes × 25 / (6 × 60)`

| Concurrentes | RPS estimado | RPS pico (×3) |
|--------------|--------------|---------------|
| 100 | 7 | 21 |
| 500 | 35 | 105 |
| 1.000 | 69 | 208 |
| 5.000 | 347 | 1.042 |
| 10.000 | 694 | 2.083 |

### Capacidad actual por componente

| Componente | Límite conocido | Cuello de botella estimado |
|------------|-----------------|---------------------------|
| Next.js (1 contenedor) | CPU-bound en SSR | ~200–400 RPS con 2 vCPU |
| Fastify API (1 contenedor) | I/O + Prisma pool | ~300–600 RPS con pool 10–20 |
| PostgreSQL (1 instancia) | Conexiones y locks | ~500–1.000 TPS lectura; escritura limitada por `EXCLUDE` en reservas |
| Redis | Memoria/CPU | > 10.000 ops/s (no crítico hoy) |
| MinIO | Ancho de banda | Depende del disco/NIC |
| nginx | Rate limit 20 r/s por IP | Protege pero limita pruebas distribuidas |

### Riesgos de escalado

| # | Riesgo | Umbral estimado | Mitigación |
|---|--------|-----------------|-----------|
| C1 | Un solo contenedor web/API | > 300 RPS | Escalar horizontalmente + balanceo |
| C2 | Conexiones Prisma | > 100 conexiones | PgBouncer / pool tuning |
| C3 | Contención del `EXCLUDE` gist en reservas | Escrituras concurrentes altas | Particionar por propiedad o cola de reservas |
| C4 | Imágenes servidas por Next | > 500 RPS | CDN (Cloudflare) delante de `/_next/image` |
| C5 | Sin caché de listados | Cada request golpea DB | `revalidate` + Redis cache |
| C6 | Rate limit por IP | Usuarios tras NAT | Ajustar burst o limitar por sesión |

## Plan de prueba requerido (acción humana)

1. Desplegar staging con datos representativos (≥ 1.000 propiedades, ≥ 10.000 reservas).
2. Ejecutar k6 con rampas 100 → 10.000 usuarios.
3. Medir: p50/p95/p99, RPS, CPU, memoria, conexiones DB, latencia de locks.
4. Repetir con el escenario "reserva concurrente sobre las mismas fechas" para validar el `EXCLUDE`.
5. Registrar resultados en este documento con fecha y commit.

## Veredicto

**NO CERTIFICADO** — no existe evidencia de carga. El modelo anterior define los umbrales a validar, no resultados.
