# Release Android — Elevari

Última validación: 2026-11-21 · rama chore/elevari-production

App Android `elevari.androidapp` (Expo SDK 58, React Native 0.88; versiones exactas en `mobile/package.json`). Alcance: **solo Android** (iOS fuera de alcance). La app consume `https://elevari.live/api/v1`; login/registro obtienen el token de Turnstile con un widget en un WebView. Push deshabilitado hasta tener un `projectId` real de EAS y un endpoint de la API para registrar tokens (ver [ROADMAP.md](../ROADMAP.md)).

## Firma

- El AAB de release se firma con una **llave de subida**; Google Play usa **Play App Signing** (Google conserva la llave de firma de la app).
- El keystore **no está en el repo** (`*.jks` ignorado). Su ruta y claves están en el gestor de contraseñas «Elevari» (ruta local en `docs/HANDOVER.private.md`).
- Propiedades de Gradle en el `~/.gradle/gradle.properties` del PC del propietario: `ELEVARI_UPLOAD_STORE_FILE`, `ELEVARI_UPLOAD_STORE_PASSWORD`, `ELEVARI_UPLOAD_KEY_ALIAS`, `ELEVARI_UPLOAD_KEY_PASSWORD`. Sin ellas, el release no debe publicarse.
- Huellas de la llave de subida (públicas):
  - SHA-1: `AA:73:EB:D5:45:00:94:89:AB:85:35:99:50:47:30:EF:2E:1C:70:71`
  - SHA-256: `EC:9E:DC:4A:6F:70:CE:D0:C8:E3:9A:C8:94:E2:41:E3:E2:F9:6E:EF:76:B9:D3:A0:88:6F:65:71:8B:3E:D5:F4`
- La huella SHA-256 de **Play App Signing** (Play Console → Integridad de la app) va en `ANDROID_SHA256_CERT_FINGERPRINTS` del servidor y se sirve en `https://elevari.live/.well-known/assetlinks.json` (`app/.well-known/assetlinks.json/route.ts`). Tras cambiarla: `docker compose ... up -d web api` según el RUNBOOK.

## Build del AAB (Windows)

Requisitos: Android Studio (su `jbr` como JDK), Android SDK con CMake **3.31.6** (`sdkmanager "cmake;3.31.6"`), `LongPathsEnabled=1` en Windows, dependencias (`cd mobile && npm install`).

```powershell
cd mobile
npx expo prebuild --platform android      # solo si mobile/android no existe (se genera; no se edita a mano)
cd android
$env:JAVA_HOME = "<ruta de Android Studio>\jbr"
.\gradlew.bat bundleRelease --no-daemon --max-workers=1
```

Salida: `mobile/android/app/build/outputs/bundle/release/app-release.aab`.

Corrección de rutas largas de Windows: el config plugin `mobile/plugins/withAndroidReleaseBuild.js` fija `externalNativeBuild.cmake.buildStagingDirectory` en `C:/b` y CMake 3.31.6, y configura la firma de release con las propiedades de arriba. Cualquier cambio nativo se hace en `app.json` o en plugins, no en `mobile/android`.

## Configuración

| Ítem | Valor |
|------|-------|
| Paquete | `elevari.androidapp` |
| Esquema | `elevari` |
| Deep links | `https://elevari.live` (`autoVerify`) |
| API | `https://elevari.live/api/v1` (`EXPO_PUBLIC_API_BASE_URL`, `extra.API_BASE_URL`) |
| Firebase | proyecto `elevari`; `google-services.json` **no se versiona** (copiar a `mobile/google-services.json` antes del build) |
| `versionCode` | incrementar en `app.json` en cada subida a Play |

## Distribución

1. **Play Console (cuenta de organización):** Internal testing → Producción. Subir el `.aab`, completar ficha, política de privacidad (`https://elevari.live/legal/privacy`), eliminación de cuenta (`https://elevari.live/legal/account-deletion`) y declaración de seguridad de datos.
2. **Firebase App Distribution:** APK de prueba para testers (`.\gradlew.bat assembleRelease --no-daemon --max-workers=1` y subir el APK a la app `elevari.androidapp` del proyecto `elevari`).

## Checklist pre-release

- [ ] `cd mobile && npx tsc --noEmit` sin errores
- [ ] `npx expo-doctor` sin críticos
- [ ] `versionCode` incrementado
- [ ] `google-services.json` presente (no versionado) con las huellas de la llave de subida y de Play App Signing en Firebase
- [ ] `.\gradlew.bat bundleRelease --no-daemon --max-workers=1` OK y firmado con la llave de subida (`keytool -printcert -jarfile app-release.aab` coincide con las huellas de arriba)
- [ ] API de producción responde (`https://elevari.live/health`)
- [ ] Login/registro en un dispositivo real (Turnstile en WebView)
- [ ] Tras Play Internal testing: huella de Play App Signing en `ANDROID_SHA256_CERT_FINGERPRINTS` y `assetlinks.json` verificado; deep links `autoVerify` OK

## Expo / EAS

`app.json` → `extra.eas.projectId` debe ser un UUID real de EAS (pendiente de que el propietario inicie sesión con `npx eas-cli@latest login` y ejecute `eas init`). Hasta entonces el push está deshabilitado. Antes de tocar APIs de Expo/EAS consultar `https://docs.expo.dev/versions/v58.0.0/` (ver `AGENTS.md`).

## Rollback

Una versión mala de Play no se «borra»: se detiene el despliegue escalonado en Play Console y se publica un nuevo AAB con `versionCode` mayor basado en el último commit bueno (`git checkout <tag>`). El backend es compatible hacia atrás con versiones previas de la app mientras no se rompa `/api/v1`.

## Documentos relacionados

[ARCHITECTURE.md](../ARCHITECTURE.md) · [GO_LIVE_CHECKLIST.md](../GO_LIVE_CHECKLIST.md) · [docs/RUNBOOK.md](../docs/RUNBOOK.md)
