# DEPENDENCY_MATRIX — Dependencias y servicios

Última validación: 2026-11-21 · rama chore/elevari-production

Fuente de versiones exactas: `package.json` (raíz), `api/package.json`, `mobile/package.json`. Esta tabla resume las principales; ante discrepancia, gana el `package.json`.

## Runtime

| Pieza | Versión | Dónde |
|-------|---------|-------|
| Node.js | 22 (imágenes `node:22-alpine`; CI web/API) y 20 (CI móvil) | Dockerfiles, `.github/workflows/ci.yml` |
| Docker / Compose | 29 / v2 | Servidor Hetzner |
| PostgreSQL | 16 | `postgres:16-alpine` |
| Redis | 7 | `redis:7-alpine` |
| MinIO | `latest` | `minio/minio` |
| nginx | 1.27 | `nginx:1.27-alpine` |

## Web (raíz)

| Paquete | Versión |
|---------|---------|
| next | ^16.2.6 |
| react / react-dom | ^19.2.6 |
| typescript | 6.0.3 |
| tailwindcss / @tailwindcss/postcss | ^4.3.0 |
| zod | ^4.4.3 |
| zustand | ^5.1.0 |
| react-hook-form | ^7.76.1 |
| resend | ^6.39.0 |
| framer-motion | ^12.40.0 |
| vitest / @playwright/test | ^3.2.7 / ^1.61.1 |

## API (`api/`)

| Paquete | Versión |
|---------|---------|
| fastify | ^5.2.1 |
| @fastify/cors, multipart, rate-limit | ^10.0.2, ^9.4.0, ^10.3.0 |
| @prisma/client / prisma | ^6.3.1 |
| zod | ^3.24.1 |
| jose, bcryptjs | ^5.10.0, ^2.4.3 |
| sharp | ^0.33.5 |
| @aws-sdk/client-s3 (cliente S3 para MinIO) | ^3.1075.0 |
| stripe | ^17.7.0 (legacy, deshabilitado) |
| typescript / tsx | ^5.7.3 / ^4.19.2 |

## Móvil (`mobile/`)

| Paquete | Versión |
|---------|---------|
| expo | ~58.0.25 |
| react-native / react | 0.88.1 / 19.3.0 |
| expo-router | ~58.0.32 |
| expo-notifications | ~58.1.9 |
| expo-secure-store | ~58.0.3 |
| expo-build-properties / expo-dev-client | ~58.0.12 / ~58.0.21 |
| @react-native-firebase/app, analytics | 27.1.1 |
| react-native-reanimated | 4.7.1 |
| typescript | ~6.0.3 |

Android: CMake 3.31.6 (vía `sdkmanager`), JDK del Android Studio (`jbr`), Gradle wrapper del proyecto generado.

## Servicios externos

| Servicio | Variables (solo nombres) | Estado |
|----------|--------------------------|--------|
| Wompi | `PAYMENTS_WOMPI_ENABLED`, `WOMPI_PUBLIC_KEY`, `WOMPI_PRIVATE_KEY`, `WOMPI_EVENTS_SECRET`, `WOMPI_INTEGRITY_SECRET`, `NEXT_PUBLIC_WOMPI_PUBLIC_KEY` | Único proveedor activo; llaves live pendientes en servidor |
| Alegra | `ALEGRA_EMAIL`, `ALEGRA_API_TOKEN` | Pendiente de credenciales |
| Resend | `RESEND_API_KEY`, `RESEND_FROM` | Dominio verificado |
| Cloudflare Turnstile | `NEXT_PUBLIC_TURNSTILE_SITE_KEY`, `TURNSTILE_SECRET_KEY` | Activo |
| Google Tag Manager / GA4 | `NEXT_PUBLIC_GTM_ID`, `NEXT_PUBLIC_GA_MEASUREMENT_ID` | Activo (build-time) |
| Meta Pixel | `NEXT_PUBLIC_META_PIXEL_ID`, `META_PIXEL_ID`, `META_ACCESS_TOKEN` | Opcional |
| Google Sign-In | `NEXT_PUBLIC_GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_ID` | Opcional |
| Firebase | `google-services.json` (no versionado) | Activo en Android |
| Bold, Stripe | `BOLD_*`, `STRIPE_*` | Código legacy deshabilitado (`PAYMENTS_BOLD_ENABLED=false`, `PAYMENTS_STRIPE_ENABLED=false`) |

Las variables `NEXT_PUBLIC_*` se incrustan en el build de la web (build args de Docker): cambiarlas exige reconstruir la imagen `web`.

## Descartado

Ver [TECHNICAL_DECISIONS.md](TECHNICAL_DECISIONS.md): AWS (EC2) descartado, Bold/Stripe como pasarelas activas descartado.
