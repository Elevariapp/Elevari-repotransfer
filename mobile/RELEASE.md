# Release Guide — Mobile (Elevari-repotransfer)

## Estado actual

La aplicación móvil está estabilizada y lista para build de producción.

- Rama principal: `b-main`
- Último commit: `33c460d` — feat(mobile): completar dependencias, assets, env y corregir errores TypeScript
- TypeScript: `tsc --noEmit` → 0 errores
- Dependencias: todas instaladas y verificadas
- Archivos de entorno: `.env`, `.env.development`, `.env.production`, `.env.example`

---

## Prerrequisitos (bloqueantes)

Antes de construir para producción se necesitan:

| Elemento | Para qué sirve | Estado |
|----------|---------------|--------|
| Cuenta de Expo (EAS) | `eas login`, builds en la nube | ⏳ Pendiente de credenciales |
| Google Play Console (service account) | `eas submit --platform android` | ⏳ Pendiente de cuenta de desarrollador |
| Apple Developer + App Store Connect | `eas build --platform ios`, `eas submit --platform ios` | ⏳ Pendiente de cuenta de desarrollador |

---

## Comandos de build

Desde `mobile/`:

```bash
# Autenticar en Expo (requiere EXPO_TOKEN o credenciales interactivas)
npx eas login

# Configurar build (si no existe eas.build)
npx eas build:configure

# Build Android (producción, distribución a tienda)
npx eas build --platform android --profile production

# Build iOS (producción, distribución a tienda)
npx eas build --platform ios --profile production
```

---

## Comandos de submit (despliegue a tiendas)

```bash
# Android → Google Play Console (track: internal)
npx eas submit --platform android --profile production

# iOS → App Store Connect
npx eas submit --platform ios --profile production
```

---

## Variables de entorno

Archivos en `mobile/`:

| Archivo | Uso | Contenido clave |
|---------|-----|-----------------|
| `.env.example` | Plantilla para desarrolladores | `EXPO_PUBLIC_API_BASE_URL`, `EXPO_PUBLIC_WOMPI_PUBLIC_KEY` |
| `.env.development` | Entorno de desarrollo | API base URL de test |
| `.env.production` | Entorno de producción | API base URL de producción, claves Wompi live |
| `.env` | Local (no se commitea) | Sobrescribe valores para desarrollo local |

**Nota:** `.env` no debe commitearse. Los demás sí.

---

## Rollback

1. Revertir el commit en `b-main`:
   ```bash
   git revert <commit-sha>
   git push origin b-main
   ```
2. Si ya se publicó en tiendas, publicar la versión anterior como actualización forzada en Google Play Console / App Store Connect.

---

## CI/CD

Workflow en `.github/workflows/ci.yml`:

- `typecheck`: ejecuta `tsc --noEmit` en cada push/PR
- `lint`: ejecuta ESLint en cada push/PR
- `build-android`: build de producción en Android solo en push a `b-main` o `main` (requiere `EXPO_TOKEN` en secrets de GitHub)

---

## Checklist pre-release

- [ ] `npx tsc --noEmit` → 0 errores
- [ ] `npx expo-doctor` sin críticas
- [ ] Credenciales de Expo configuradas (`EXPO_TOKEN`)
- [ ] Service account de Google Play en `mobile/secrets/google-service-account.json`
- [ ] `.env.production` con valores reales (no placeholders)
- [ ] Build de Android exitoso en EAS
- [ ] Submit a Google Play Console (track: internal) exitoso