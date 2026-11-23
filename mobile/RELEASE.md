# Release Guide — Mobile (Elevari-repotransfer)

## Estado actual

La aplicación móvil está implementada y preparada para la siguiente fase de build/release.

- Rama principal: `b-main`
- TypeScript: `npm run typecheck` debe terminar con 0 errores
- Android package: `elevari.androidapp`
- iOS bundle: `elevari.iosapp`
- API móvil: `https://elevari.live/api/v1`
- Iconos, splash, escena de autenticación y assets Android: incluidos
- SDK Expo: 58

---

## Prerrequisitos (bloqueantes)

Antes de construir para producción se necesitan:

| Elemento | Para qué sirve | Estado |
|----------|---------------|--------|
| Cuenta de Expo (EAS) | `eas login`, `eas init` y builds en la nube | Pendiente: cuenta y `EXPO_TOKEN` |
| Google Play Console (service account) | `eas submit --platform android` | Pendiente: cuenta de desarrollador y credenciales |
| Apple Developer + App Store Connect | `eas build --platform ios`, `eas submit --platform ios` | Pendiente: cuenta y certificados |
| EAS project ID | Vincula el proyecto y los push notifications | Aún no configurado |
| Google Services JSON | Firebase/FCM para Android | Falta el archivo real; no usar el valor placeholder |

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