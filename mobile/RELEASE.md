# Release Guide — Mobile (Elevari-repotransfer)

## Estado actual

| Canal | Estado |
|-------|--------|
| **APK instalable (sideload)** | Listo: se compila en GitHub Actions (workflow **Mobile APK**) sin cuenta de Expo y se publica en una release de GitHub. Guía para usuarios: https://elevari.live/app |
| **Google Play** | **En pausa: el propietario está completando el registro en Play Console.** Nada de este repositorio publica en Play por sí solo (ver «Google Play — en pausa»). |
| **App Store (iOS)** | Configuración lista; no hay envío. Requiere cuenta de Apple Developer. |

Datos de la app:

- Android: paquete `elevari.androidapp`, Android 7.0 o superior (minSdk 24), targetSdk 36
- iOS: bundle `elevari.iosapp`, solo iPhone
- Versión `1.0.0` (`mobile/app.json`), Expo SDK 58, React Native 0.88
- API: `https://elevari.live/api/v1`
- Rama principal: `b-main`

---

## Lanzar el APK: pasos del propietario

En este orden. Todo lo demás ya está hecho en el código.

1. **Revisa y fusiona el PR** en `b-main`. El push despliega la web: `https://elevari.live/app` queda publicada y muestra «Disponible muy pronto» hasta que exista la primera release.
2. **Comprueba el acceso a la API desde la app** (sección siguiente). Si Turnstile está activo y falta la clave, nadie podrá iniciar sesión ni registrarse desde la app.
3. **Recomendado: crea la firma estable** (sección «Firma del APK») antes de repartir el APK. Sin ella cada compilación tiene otra firma y los testers tendrán que desinstalar antes de actualizar.
4. **Ejecuta el workflow**: GitHub → **Actions** → **Mobile APK** → **Run workflow** → rama `b-main`, `publish_release` activado. Por CLI:
   ```bash
   gh workflow run mobile-apk.yml -R Elevariapp/Elevari-repotransfer --ref b-main -f publish_release=true
   ```
   Tarda unos 20–25 minutos. Tiene que ser desde `b-main`: solo esa rama publica la release `android-latest` que enlaza la web (cualquier otra rama publica `android-preview`).
5. **Comprueba el resultado**: release `android-latest` con `elevari.apk`, `elevari.apk.sha256` y `elevari-build.json`. Cuando se renueve la caché de la web (hasta 5 minutos), `/app` muestra el botón de descarga, la versión y el SHA-256.
6. **Instálala en un Android real** y recorre la checklist de «Probar el APK».
7. **Comparte** `https://elevari.live/app` (no el enlace directo al `.apk`): ahí están los pasos de instalación, el aviso de firma y el SHA-256.

---

## Acceso a la API desde la app (Turnstile)

La app no puede mostrar el widget de Cloudflare Turnstile y no envía `turnstile_token`. Si Turnstile está activo en el servidor (`TURNSTILE_SECRET_KEY` definido y `TURNSTILE_DISABLED` distinto de `1` en `/opt/elevari/.env.production`), `POST /auth/login`, `/auth/register` y `/auth/google` rechazan a la app con `turnstile_failed` **salvo que envíe la clave de cliente**. No tengo acceso a la configuración de producción: compruébalo tú.

Si Turnstile está activo:

1. Genera una clave: `openssl rand -hex 24`.
2. Ponla en `API_CLIENT_KEY` en `/opt/elevari/.env.production` y redespliega la API.
3. Guarda el mismo valor como secreto de GitHub `EXPO_PUBLIC_API_KEY` (Settings → Secrets and variables → Actions) y vuelve a ejecutar **Mobile APK**.

La clave queda dentro del APK (cualquiera puede extraerla): solo identifica a la app y los límites de peticiones siguen aplicando. Cuando el APK se compila sin ella, el resumen del job y un aviso lo dicen.

Si Cloudflare (WAF o Bot Fight Mode) bloquea las peticiones de la app (respuestas 403 o una página «Just a moment…» en lugar de JSON), crea una regla de WAF con acción *Skip* para `elevari.live/api/*` cuando la cabecera `x-api-key` tenga ese valor. Sin verificar: no hay acceso a elevari.live desde donde se preparó este flujo.

---

## Firma del APK

| Situación | Firma | Consecuencia |
|-----------|-------|--------------|
| Sin secretos `ANDROID_KEYSTORE_*` (estado actual) | Llave **de prueba**, desechable, generada en cada ejecución | Cada compilación tiene otra firma: Android **no deja actualizar** encima de la instalación anterior y hay que desinstalarla primero (se borran los datos locales de la app, no la cuenta). El resumen del job, la release y `/app` lo avisan. |
| Con los secretos de abajo | Tu llave de publicación | Las versiones nuevas se instalan como actualización. |

### Firma estable (una sola vez)

1. Genera la llave **fuera del repositorio**:
   ```bash
   keytool -genkeypair -v -storetype PKCS12 -keystore elevari-release.keystore \
     -alias elevari -keyalg RSA -keysize 2048 -validity 10000 \
     -dname "CN=Elevari, O=Elevari, C=CO"
   ```
   `keytool` pide la contraseña (usa una larga). En un keystore PKCS12 la llave usa la misma contraseña.
2. Guarda **dos copias** del archivo y de la contraseña (gestor de contraseñas y respaldo sin conexión). Si se pierden, nadie podrá actualizar las instalaciones firmadas con esa llave.
3. Crea los secretos del repositorio (Settings → Secrets and variables → Actions):

   | Secreto | Valor |
   |---------|-------|
   | `ANDROID_KEYSTORE_BASE64` | `base64 -w0 elevari-release.keystore` (macOS: `base64 -i elevari-release.keystore`) |
   | `ANDROID_KEYSTORE_PASSWORD` | La contraseña del paso 1 |
   | `ANDROID_KEY_ALIAS` | `elevari` |
   | `ANDROID_KEY_PASSWORD` | Opcional: solo si la llave tiene otra contraseña (con PKCS12, déjalo vacío) |

   Por CLI: `base64 -w0 elevari-release.keystore | gh secret set ANDROID_KEYSTORE_BASE64 -R Elevariapp/Elevari-repotransfer`.
4. Ejecuta **Mobile APK** otra vez. El resumen dice «Firmado con la llave de publicación» y `elevari-build.json` trae `"signing": "release"` y el `signerSha256` de tu certificado.
5. Quien tenga instalada una versión de prueba debe desinstalarla una vez.

Reglas: los tres primeros secretos van juntos; con uno o dos el workflow falla a propósito, para que un error al teclear no genere en silencio un APK con firma de prueba. Nunca subas el keystore al repositorio.

---

## Secretos opcionales del workflow

| Secreto | Para qué | Si falta |
|---------|----------|----------|
| `EXPO_PUBLIC_API_KEY` | Cabecera `x-api-key` de la app (sección Turnstile) | El APK compila, pero con Turnstile activo no podrá iniciar sesión |
| `GOOGLE_SERVICES_JSON` | Contenido de `google-services.json` de Firebase (app Android `elevari.androidapp`) | El APK compila sin Firebase |
| `EXPO_TOKEN` | Solo para el job opcional `eas` (cuenta de Expo) | Ese job falla a propósito si lo pides sin token |

**Notificaciones push:** el APK **no** recibe notificaciones del sistema aunque exista `GOOGLE_SERVICES_JSON`. Faltan tres piezas que hoy no existen: Firebase (FCM), un proyecto de EAS (la app solo registra su token si `extra.eas.projectId` existe, y eso requiere cuenta de Expo) y un envío desde la API (hoy solo guarda el token). El listado de notificaciones dentro de la app sí funciona.

---

## Probar el APK

En un teléfono Android 7.0 o superior:

1. Abre https://elevari.live/app y toca **Descargar el APK** (o abre el enlace de la release).
2. Si Android lo pide, activa **Permitir instalar desde esta fuente** para tu navegador o gestor de archivos. Play Protect puede pedir confirmación («Instalar de todos modos» o analizar la app): es normal en apps instaladas fuera de Play.
3. Instala y abre Elevari.

Verificar la descarga (opcional): `sha256sum -c elevari.apk.sha256` junto al archivo, o compara con el SHA-256 que muestra `/app`.

Checklist de QA a mano (la app no tiene pruebas automáticas de interfaz):

- [ ] Abre sin cerrarse: splash naranja y pantalla de inicio de sesión
- [ ] Registro con una cuenta de prueba, cierre de sesión, inicio de sesión y «¿Olvidaste tu contraseña?»
- [ ] Explorar y abrir una propiedad
- [ ] Cotizar y reservar hasta el pago: se abre la página de Wompi en el navegador y, al volver, la reserva aparece en «Mis reservas»
- [ ] Cuenta anfitriona: pestañas de propiedades y reservas
- [ ] Perfil: ayuda por WhatsApp, textos legales y «Eliminar mi cuenta» (solo con una cuenta de prueba)

Riesgo de la distribución fuera de Play: Google anunció en 2025 una verificación obligatoria de desarrolladores para instalar apps en dispositivos Android certificados, con despliegue gradual por países desde 2026. No pude verificar el estado actual ni si afecta a Colombia: compruébalo antes de depender solo del APK.

---

## Cómo funciona el workflow «Mobile APK»

Archivo: `.github/workflows/mobile-apk.yml`. Solo se ejecuta a mano (`workflow_dispatch`): ningún push ni PR lo lanza y nunca despliega la web. Solo el job de publicación tiene permiso de escritura en el repositorio.

| Entrada | Por defecto | Qué hace |
|---------|-------------|----------|
| `publish_release` | sí | Publica el APK en una prerelease de GitHub: `android-latest` si la rama es `b-main`, `android-preview` en cualquier otra (cada ejecución reemplaza la anterior). Desactívalo para quedarte solo con el artefacto. |
| `eas_build` | no | Además compila en EAS. Necesita `EXPO_TOKEN` y un `extra.eas.projectId` real: sin ellos falla con un mensaje claro, no se salta en silencio. |
| `eas_profile` | `preview` | Perfil de EAS para ese job: `preview` (APK) o `production` (AAB). |

Pasos del job «Build and sign APK», en orden: `npm ci` en `mobile/` → `expo config` y `typecheck` → resolver la firma → `versionCode` = minutos desde 1970 (siempre creciente) → `expo prebuild --platform android` (con `GOOGLE_SERVICES_JSON` si existe) → `./gradlew assembleRelease` (armeabi-v7a, arm64-v8a, x86_64) → verificar y empaquetar.

Lo que verifica antes de publicar (si algo falla **no** se publica nada): paquete `elevari.androidapp`; `versionCode` numérico; targetSdk 36 o superior; APK no depurable; ninguno de los permisos que bloquea `app.json`; firmado con la llave preparada y no con la llave de depuración pública de Expo; con librerías nativas.

| Resultado | Contenido |
|-----------|-----------|
| Artefacto `elevari-apk` (30 días) | `elevari.apk`, `elevari.apk.sha256`, `elevari-build.json`, `release-notes.md` |
| Release `android-latest` (solo desde `b-main`) | `elevari.apk`, `elevari.apk.sha256`, `elevari-build.json`. Enlace estable: https://github.com/Elevariapp/Elevari-repotransfer/releases/download/android-latest/elevari.apk |
| Release `android-preview` (cualquier otra rama) | Lo mismo, para probar una rama antes de fusionarla: https://github.com/Elevariapp/Elevari-repotransfer/releases/tag/android-preview |
| Resumen del job | Versión, permisos, firma (con aviso si es de prueba), SHA-256 |

`elevari-build.json` (lo lee la web): `package`, `versionName`, `versionCode`, `minSdk`, `targetSdk`, `sizeBytes`, `sha256`, `signing` (`test` o `release`), `signerSha256`, `abis`, `commit`, `ref`, `builtAt`, `runUrl`.

Las ejecuciones de una misma rama se encolan (no se pisan al publicar). Las releases se marcan como prerelease para que no aparezcan como «Latest» del repositorio. `versionName` es el `version` de `mobile/app.json`: súbelo a mano cuando quieras una versión visible nueva.

---

## La web: «Instalar la app»

- Página: https://elevari.live/app, con el enlace «Instalar la app» en el pie de página. Código: `app/app/page.tsx`, `lib/apk-info.ts`, `lib/app-links.ts` y `components/pwa/`.
- Lee `elevari-build.json` de la release `android-latest` (caché de 5 minutos): versión, tamaño, fecha, SHA-256 y si la firma es de prueba. Si la release no existe o GitHub no responde muestra «Disponible muy pronto»: nunca un enlace roto.
- Siempre ofrece la alternativa web (PWA): «Añadir a pantalla de inicio» en Android (Chrome) y en iPhone (Safari). El código QR (`public/brand/qr-app.svg`) apunta a `https://elevari.live/app`.
- **Google Play:** `NEXT_PUBLIC_PLAY_STORE_LIVE=1` activa el botón «Descarga la app para Android» (ficha de Play) en `/app` y en la tarjeta de instalación. Se lee al **compilar** la web: ponlo en `/opt/elevari/.env.production` (ver `deploy/.env.production.example`) y redespliega. No lo actives hasta que la ficha sea pública. `NEXT_PUBLIC_ANDROID_APP_URL` (ya existía) sustituye la URL de Play en la tarjeta si se define.

---

## Variables de entorno de la app

La app solo lee variables `EXPO_PUBLIC_*`, que se incrustan al compilar:

| Variable | Uso | Valor |
|----------|-----|-------|
| `EXPO_PUBLIC_API_BASE_URL` | Base de la API | `https://elevari.live/api/v1`. Es el valor de `.env.example` y `.env.development`, y lo fijan el workflow y el perfil `production` de `eas.json` |
| `EXPO_PUBLIC_API_KEY` | Cabecera `x-api-key` (ver Turnstile) | Opcional. Secreto de GitHub del mismo nombre |

No existe `.env.production` ni clave pública de Wompi en la app: el pago se hace en la página alojada de Wompi (la app abre el navegador) y nunca ve datos de tarjeta. `app.json › extra` es público por diseño (URLs legales, comisión): nunca pongas secretos ahí. `.env` y `.env*.local` no se commitean.

---

## Rollback

- **Retirar el APK de la web:** `gh release delete android-latest --cleanup-tag --yes -R Elevariapp/Elevari-repotransfer`. En menos de 5 minutos `/app` vuelve a mostrar «Disponible muy pronto». Quien ya lo instaló lo conserva.
- **Volver a una versión anterior:**
  ```bash
  git revert <commit-sha>
  git push origin b-main
  ```
  y ejecuta **Mobile APK** otra vez en `b-main`. El `versionCode` siempre sube (minutos desde 1970), así que se instala como actualización, pero solo si la firma es la misma: por eso conviene la firma estable.
- Web: ver `docs/HANDOVER.md` (flujo de deploy).

---

## CI/CD

| Workflow | Qué hace con la app |
|----------|---------------------|
| `.github/workflows/mobile-apk.yml` («Mobile APK») | Solo manual. Compila, firma y publica el APK (esta guía). |
| `.github/workflows/ci.yml` › `mobile-typecheck` | `npm run typecheck` en `mobile/` en cada push y PR. |
| `.github/workflows/ci.yml` › `mobile-build-android` («Mobile Android build (EAS)») | Solo en `b-main` y si `mobile/` cambió: encola en EAS un AAB de producción y un APK de preview. **Se salta con un aviso** mientras falten `EXPO_TOKEN` y `extra.eas.projectId`; no produce el APK de esta guía. Cuando existan, cada cambio en `mobile/` consumirá compilaciones de EAS. |
| `.github/workflows/ci.yml` › «Lint workflows (actionlint)» | Valida todos los workflows, incluido `mobile-apk.yml`. |

Ejecutar `ci.yml` a mano sobre `b-main` despliega a producción: para probar la app usa **Mobile APK**.

---

## Google Play — en pausa

**En pausa: el propietario está completando el registro en Play Console.** Ya está listo en el repositorio para cuando se reanude:

- `targetSdk` 36 (valor por defecto de React Native 0.88) y permisos mínimos (ver «Cumplimiento»).
- `mobile/eas.json`: `appVersionSource: remote`; perfil `production` (AAB para la tienda, `autoIncrement`, API de producción) y `preview` (APK); perfiles de envío `production` (pista `internal`), `alpha`, `beta` y `release` (pista `production`, en borrador).
- `mobile/app.config.js` usa `google-services.json` (Firebase) si existe. `mobile/secrets/` y los JSON de credenciales están en `.gitignore`: nunca subas claves.
- El APK de esta guía **no** sirve para Play (Play exige AAB) y su firma y `versionCode` son distintos: quien lo haya instalado tendrá que desinstalarlo antes de instalar desde Play.

Pasos para reanudar, en orden (solo el propietario puede hacerlos):

1. **Cuenta de Expo y proyecto EAS:** `cd mobile && npx eas-cli login && npx eas-cli init`; commitea el `projectId` que escribe en `mobile/app.json` (`extra.eas.projectId`). No lo inventes.
2. **`EXPO_TOKEN`:** créalo en expo.dev (Account settings › Access tokens) y guárdalo como secreto de GitHub. Activa `mobile-build-android` de `ci.yml` y el job `eas` de **Mobile APK**.
3. **Play Console:** crea la app (paquete `elevari.androidapp`) y completa la ficha, la seguridad de los datos (tabla de abajo), la clasificación de contenido, el público objetivo, los anuncios y el acceso a la app (cuentas de prueba de huésped y anfitrión para los revisores: la app exige iniciar sesión), la política de privacidad `https://elevari.live/legal/privacy` y la eliminación de cuenta `https://elevari.live/legal/account-deletion`.
4. **Primera versión a mano:** Google exige subir manualmente la primera versión de una app nueva desde la consola (conocimiento general, sin verificar). Compila el AAB con `npx eas-cli build --platform android --profile production` y descárgalo de expo.dev.
5. **Cuenta de servicio:** Google Cloud › cuenta de servicio con clave JSON › invítala en Play Console (Usuarios y permisos) con permiso para publicar versiones. Guarda el JSON en `mobile/secrets/google-play-service-account.json` (ignorado por git) o súbelo como credencial de EAS.
6. **Firebase (push):** proyecto de Firebase con la app Android `elevari.androidapp`; `google-services.json` como variable de archivo de EAS (`GOOGLE_SERVICES_JSON`). El envío de notificaciones desde la API sigue sin existir.
7. **Enlaces verificados** (`autoVerify` para `https://app.elevari.live/`): tras la primera compilación, añade el SHA-256 de la firma (Play Console › Integridad de la app › Firma de apps) a `https://app.elevari.live/.well-known/assetlinks.json`. La web hoy **no sirve** ese archivo (no hay `/.well-known/` en `public/` ni en `app/`).
8. **Cuentas personales:** Google puede exigir una prueba cerrada con 12 testers durante 14 días antes del acceso a producción en cuentas personales nuevas (sin verificar: confirma la regla vigente en Play Console).
9. **Compilar y enviar:**
   ```bash
   cd mobile
   npx eas-cli build --platform android --profile production
   npx eas-cli submit --platform android --profile production   # pista interna
   npx eas-cli submit --platform android --profile alpha        # prueba cerrada
   npx eas-cli submit --platform android --profile release      # producción, en borrador
   ```
   `eas submit` no tiene `--track`: la pista sale del perfil de envío. Si Play responde que en una app en borrador solo se admiten versiones en estado `draft`, cambia `releaseStatus` a `draft` en `submit.production.android` hasta que la app salga de borrador (sin verificar).
10. Cuando la ficha sea pública, pon `NEXT_PUBLIC_PLAY_STORE_LIVE=1` en la web y redespliega.

---

## iOS (sin envío)

Configurado en `mobile/app.json`: bundle `elevari.iosapp`, solo iPhone (`supportsTablet: false`), `usesNonExemptEncryption: false` (la app solo usa HTTPS) y enlaces universales `applinks:app.elevari.live`. No hay textos de permisos (`NS…UsageDescription`) porque la app no usa cámara, fotos, ubicación ni Face ID (`expo-secure-store` con `faceIDPermission: false`).

Para publicar hace falta una cuenta de Apple Developer (de pago) y los pasos de EAS de la sección anterior con `--platform ios`. El perfil `submit.production.ios` está vacío a propósito: EAS pedirá el Apple ID y el ASC App ID la primera vez. Antes de enviar:

1. Genera el proyecto en una carpeta temporal (`npx expo prebuild --platform ios --no-install`) y revisa `PrivacyInfo.xcprivacy` y el entitlement `aps-environment` (queda en `development`).
2. Publica `apple-app-site-association` en `https://app.elevari.live/.well-known/` con el Team ID de Apple (la web no lo sirve hoy).

---

## Cumplimiento (Play y App Store)

| Tema | Estado |
|------|--------|
| Permisos de Android | Los mínimos. `app.json` bloquea CAMERA, RECORD_AUDIO, SYSTEM_ALERT_WINDOW y READ/WRITE_EXTERNAL_STORAGE, y el workflow lista los permisos finales del APK en el resumen. |
| Tráfico HTTP en claro | Desactivado en la versión de release (solo HTTPS). |
| Copias de seguridad | `allowBackup: false`: el token de sesión no se copia a la nube. |
| Eliminación de cuenta | En la app: Perfil › «Eliminar mi cuenta». En la web: https://elevari.live/legal/account-deletion (la URL que pide el formulario de Play). |
| Privacidad y términos | Dentro de la app (pantallas legales) y en https://elevari.live/legal/privacy y `/legal/terms`. |
| Pagos | Estancias reales pagadas en la página alojada de Wompi. Google Play Billing no es obligatorio para bienes y servicios físicos (conocimiento general) y la app nunca toca datos de tarjeta. |
| Secretos en la app | Ninguno: `extra` solo lleva URLs públicas y la clave `x-api-key` es opcional y pública por diseño. |
| API objetivo | 36. Play exige el nivel de API reciente en apps nuevas y actualizaciones: no pude verificar la política vigente (sin acceso a Google). |

Lo que podría provocar un rechazo en Play: no dar cuentas de prueba a los revisores (la app exige iniciar sesión); una seguridad de los datos que no coincida con la tabla de abajo; contenido generado por usuarios (los anfitriones publican anuncios; existe la pantalla `legal/content-moderation`, pero conviene confirmar que hay una forma de reportar contenido); enlaces verificados sin `assetlinks.json`.

### Datos que recoge la app (borrador para «Seguridad de los datos»)

Basado en leer el código de `mobile/`; sin verificar en Play Console.

| Dato | ¿Lo recoge la app? | Detalle |
|------|--------------------|---------|
| Nombre y correo | Sí, obligatorios al registrarse | Cuenta y reservas. Una copia del perfil queda en el almacén seguro del teléfono (SecureStore). |
| Contraseña | Solo al iniciar sesión o registrarse | Viaja por HTTPS; la app guarda el token de sesión, no la contraseña. |
| Teléfono | Opcional (Perfil › Editar) | Contacto de la reserva. |
| Rol, reservas, pagos y facturas | Sí | Los muestra la app; los importes y estados vienen del servidor. |
| Datos de alojamientos | Solo anfitriones | Título, ciudad, descripción, precio por noche y máximo de huéspedes. |
| Datos de tarjeta | **No** | El pago ocurre en la página de Wompi, en el navegador. |
| Ubicación, cámara, micrófono, contactos, fotos y archivos | **No** | Sin permisos ni selector de archivos. |
| Token de notificaciones (Expo) y plataforma | **No, hoy** | Solo se enviaría si existe `extra.eas.projectId` y el usuario acepta el permiso. |
| Analítica, publicidad e informes de fallos | **No** | La app no incluye ningún SDK de estos. |

Cifrado en tránsito: sí (HTTPS). Eliminación de datos: sí, en la app y en la URL de arriba. Marco legal: Ley 1581 de 2012 (Colombia). Con quién se comparten los datos (Wompi para el pago, el anfitrión para la reserva) lo deciden el servidor y la API, que no se revisaron para este documento: confírmalo antes de contestar el formulario.

---

## Pendientes conocidos

- `mobile/eas.json`, perfil `development`: pide un cliente de desarrollo, pero `expo-dev-client` no es dependencia, así que ese perfil no produce un cliente utilizable (ya era así).
- La web no sirve `/.well-known/assetlinks.json` ni `apple-app-site-association`: los enlaces verificados no se verifican y se abren en el navegador. No afecta al APK.
- La API solo guarda los tokens push; no existe un envío de notificaciones.

---

## Checklist pre-release (APK)

- [ ] `cd mobile && npm run typecheck` sin errores
- [ ] Si Turnstile está activo: `API_CLIENT_KEY` en el servidor y secreto `EXPO_PUBLIC_API_KEY` en GitHub con el mismo valor
- [ ] Secretos `ANDROID_KEYSTORE_*` definidos y copia de la llave guardada (firma estable)
- [ ] **Mobile APK** en verde sobre `b-main` y release `android-latest` con los tres archivos
- [ ] https://elevari.live/app muestra versión y SHA-256; el QR abre la página
- [ ] Instalación y checklist de QA hechas en un Android real
- [ ] (Al reanudar Play) pasos de «Google Play — en pausa»