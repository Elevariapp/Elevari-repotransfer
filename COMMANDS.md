# COMMANDS — Comandos y quality gate

Última validación: 2026-11-21 · rama chore/elevari-production

## Quality gate (antes de CUALQUIER push)

```bash
npx tsc --noEmit                                   # web (raíz)
cd api && npx tsc --noEmit && cd ..                # API
cd mobile && npx tsc --noEmit && cd ..             # móvil
npx next build                                     # con NEXT_PUBLIC_API_URL apuntando a una URL inalcanzable debe compilar igual
docker compose -f docker-compose.prod.yml --env-file <env> build
npm run docs:lint                                  # documentación canónica
```

```powershell
# Android (Windows), desde mobile/android
$env:JAVA_HOME = "<ruta de Android Studio>\jbr"
.\gradlew.bat bundleRelease --no-daemon --max-workers=1
```

`<env>` es un archivo de entorno de producción (`/opt/elevari/.env.production` en el servidor, o una copia local con valores de prueba que no se commitea). Ver [mobile/RELEASE.md](mobile/RELEASE.md) para los requisitos de firma.

## Desarrollo local

| Acción | Comando |
|--------|---------|
| Infra local (postgres, redis, minio) | `npm run docker:infra` |
| Migraciones | `npm run api:migrate` |
| Seed demo (solo desarrollo local; se niega con `NODE_ENV=production`) | `cd api && npm run db:seed` |
| API en watch | `npm run api:dev` |
| Web | `npm run dev` |
| Móvil (dev client) | `cd mobile && npx expo start` / `npx expo run:android` |
| Lint de docs | `npm run docs:lint` |
| Auditorías de certificación | `npm run test:cert`, `npm run test:domain` |
| E2E | `npm run test:e2e` |

## Producción (en el servidor, `/opt/elevari`)

| Acción | Comando |
|--------|---------|
| Build | `docker compose -f docker-compose.prod.yml --env-file .env.production build` |
| Arrancar / actualizar | `docker compose -f docker-compose.prod.yml --env-file .env.production up -d` |
| Estado | `docker compose -f docker-compose.prod.yml ps` |
| Logs | `docker compose -f docker-compose.prod.yml logs -f --tail=100 api web nginx` |
| Health | `curl -s http://localhost/health` (el puerto 80 solo sirve `/health`; lo demás redirige a HTTPS) |
| Backup manual | `./deploy/scripts/backup-db.sh` |
| Restaurar | `./deploy/scripts/restore-db.sh backups/<archivo>.sql.gz --yes` |
| Validar env de producción | `./deploy/scripts/validate-env.sh` (estricto, solo producción) |
| Bootstrap: primer admin | `docker compose -f docker-compose.prod.yml --env-file .env.production exec -e ADMIN_EMAIL=reserve@elevari.live -e ADMIN_PASSWORD='<≥12 caracteres>' api npm run create-admin` (`RESET_PASSWORD=true` para resetear) |
| Bootstrap: publicar «Glamping Waná» (sin usuarios demo ni reseñas) | `docker compose -f docker-compose.prod.yml --env-file .env.production exec -e HOST_EMAIL=reserve@elevari.live api npm run seed:property` |

Nunca ejecutar `npm run db:seed` en producción (solo corre con `ALLOW_DEMO_SEED=true`).

Atajos npm: `npm run docker:prod:build`, `docker:prod:up`, `docker:prod:down`, `go-live:validate`, `go-live:deploy`, `go-live:verify`, `db:backup`, `db:restore`.

Procedimientos completos (rollback, rotación, incidentes): [docs/RUNBOOK.md](docs/RUNBOOK.md).

## CI

`.github/workflows/ci.yml` automatiza parte del gate: build de API y web, typecheck móvil, gate de `verification-log.md` y un job `npm run docs:lint`. El gate local sigue siendo obligatorio antes de cada push (CI no construye las imágenes Docker de producción ni el AAB).

## Acceso al servidor

```bash
ssh deploy@<SERVER_IP>      # llave SSH ed25519 del propietario; valores reales en docs/HANDOVER.private.md (local, no versionado)
```

## Cadena de herramientas Android (Windows)

- JDK: el `jbr` de Android Studio (`JAVA_HOME`).
- CMake 3.31.6 instalado con `sdkmanager`; `LongPathsEnabled=1` en Windows.
- Propiedades de firma en `~/.gradle/gradle.properties`: `ELEVARI_UPLOAD_STORE_FILE`, `ELEVARI_UPLOAD_STORE_PASSWORD`, `ELEVARI_UPLOAD_KEY_ALIAS`, `ELEVARI_UPLOAD_KEY_PASSWORD`.
- Salida: `mobile/android/app/build/outputs/bundle/release/app-release.aab`.
