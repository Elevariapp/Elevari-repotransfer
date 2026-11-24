#!/usr/bin/env bash
# Verifies the release APK produced by `./gradlew assembleRelease` and packages it for distribution.
# Run it from mobile/ with SIGNING_MODE and SIGNING_CERT_SHA256 exported by android-apk-sign.sh.
#
# Fails (instead of publishing something wrong) when the APK has the wrong package, targets an old SDK, is debuggable,
# is not signed with the key that android-apk-sign.sh prepared, or is signed with the public debug key.
#
# Writes dist/elevari.apk, dist/elevari.apk.sha256 (bare file name, so `sha256sum -c` works next to the APK),
# dist/elevari-build.json (read by the website) and dist/release-notes.md (the GitHub release body), plus a Spanish
# summary to $GITHUB_STEP_SUMMARY. The publish job only handles these files as data.
set -euo pipefail

: "${SIGNING_MODE:?SIGNING_MODE is not set}"
: "${SIGNING_CERT_SHA256:?SIGNING_CERT_SHA256 is not set}"
sdk_root="${ANDROID_HOME:-${ANDROID_SDK_ROOT:-}}"
: "${sdk_root:?ANDROID_HOME is not set}"

fail() {
  echo "::error title=APK verification failed::$1" >&2
  exit 1
}

out_dir=android/app/build/outputs/apk/release
mapfile -t apks < <(find "$out_dir" -maxdepth 1 -name '*.apk' 2> /dev/null)
[ "${#apks[@]}" -eq 1 ] || fail "Expected exactly one APK in mobile/$out_dir, found ${#apks[@]}."
apk="${apks[0]}"

build_tools="$(find "$sdk_root/build-tools" -mindepth 1 -maxdepth 1 -type d | sort -V | tail -n 1)"
if [ ! -x "$build_tools/aapt2" ] || [ ! -x "$build_tools/apksigner" ]; then
  fail "aapt2 / apksigner not found in $sdk_root/build-tools."
fi

badging="$("$build_tools/aapt2" dump badging "$apk")"
package_name="$(sed -n "s/^package: name='\([^']*\)'.*/\1/p" <<< "$badging" | head -n 1)"
version_code="$(sed -n "s/^package: .* versionCode='\([0-9]*\)'.*/\1/p" <<< "$badging" | head -n 1)"
version_name="$(sed -n "s/^package: .* versionName='\([^']*\)'.*/\1/p" <<< "$badging" | head -n 1)"
# aapt2 names the minimum SDK "sdkVersion" or "minSdkVersion" depending on the build-tools release.
min_sdk="$(sed -n "s/^\(sdkVersion\|minSdkVersion\):'\([0-9]*\)'.*/\2/p" <<< "$badging" | head -n 1)"
target_sdk="$(sed -n "s/^targetSdkVersion:'\([0-9]*\)'.*/\1/p" <<< "$badging" | head -n 1)"

# Reads one integer attribute (decimal or 0x hex, with or without a "(type 0x10)" prefix) from `aapt2 dump xmltree`.
manifest_int() {
  local raw
  raw="$(sed -n "s/.*[:.]$1(0x[0-9a-fA-F]*)=\(([^)]*)\)\{0,1\}\(0x[0-9a-fA-F]\{1,\}\|[0-9]\{1,\}\).*/\2/p" <<< "$manifest_dump" | head -n 1)"
  if [ -n "$raw" ]; then printf '%d' "$raw"; fi
}
manifest_dump=""
if ! [[ "$min_sdk" =~ ^[0-9]+$ && "$target_sdk" =~ ^[0-9]+$ ]]; then
  manifest_dump="$("$build_tools/aapt2" dump xmltree --file AndroidManifest.xml "$apk" || true)"
  min_sdk="$(manifest_int minSdkVersion)"
  target_sdk="$(manifest_int targetSdkVersion)"
fi

expected_package="$(jq -r '.expo.android.package' app.json)"
[ "$package_name" = "$expected_package" ] || fail "Package is '$package_name', app.json says '$expected_package'."
[[ "$version_code" =~ ^[0-9]+$ ]] || fail "Could not read versionCode from the APK."
if ! [[ "$min_sdk" =~ ^[0-9]+$ && "$target_sdk" =~ ^[0-9]+$ ]]; then
  echo "::group::aapt2 output (for diagnosing the SDK lookup)"
  { grep -i 'sdk' <<< "$badging" || true; } | head -n 20
  head -n 30 <<< "$manifest_dump"
  echo "::endgroup::"
  fail "Could not read minSdk/targetSdk from the APK."
fi
[ "$target_sdk" -ge 36 ] || fail "targetSdkVersion is $target_sdk; expected 36 or higher. Check for stale SDK overrides in mobile/app.json."
if grep -q '^application-debuggable' <<< "$badging"; then fail "The APK is debuggable."; fi

# app.json blocks some permissions that libraries would otherwise add: prove the final manifest honours that.
# INTERNET is always declared, so not finding it means the permission lines could not be read and the check would pass for nothing.
permissions_of() { sed -n "s/^uses-permission[a-z0-9-]*: name='\([^']*\)'.*/\1/p" | sort -u; }
mapfile -t permissions < <(permissions_of <<< "$badging")
if ! printf '%s\n' "${permissions[@]}" | grep -qx 'android.permission.INTERNET'; then
  mapfile -t permissions < <("$build_tools/aapt2" dump permissions "$apk" 2> /dev/null | permissions_of || true)
fi
if ! printf '%s\n' "${permissions[@]}" | grep -qx 'android.permission.INTERNET'; then
  echo "::group::aapt2 output (permissions could not be read)"
  { grep -i 'permission' <<< "$badging" || true; } | head -n 30
  echo "::endgroup::"
  fail "Could not read the declared permissions from the APK (android.permission.INTERNET not found)."
fi
while IFS= read -r blocked; do
  for permission in "${permissions[@]}"; do
    [ "$permission" != "$blocked" ] || fail "The APK still declares $blocked, which mobile/app.json blocks."
  done
done < <(jq -r '.expo.android.blockedPermissions[]?' app.json)
permission_list="$(printf '%s\n' "${permissions[@]}" | sed 's/^android\.permission\.//' | paste -sd, - | sed 's/,/, /g')"

signer_report="$("$build_tools/apksigner" verify --verbose --print-certs "$apk" 2>&1)" || {
  echo "$signer_report"
  fail "apksigner could not verify the APK signature."
}
echo "::group::apksigner report"
echo "$signer_report"
echo "::endgroup::"
# The certificate lines are labelled "Signer #1 ...", "Signer (minSdkVersion=..., maxSdkVersion=...) ..." or, in newer
# build-tools, "V2 Signer: ..." / "V3.1 Signer: (minSdkVersion=...) ...". "Source Stamp Signer" lines are another key.
mapfile -t signer_digests < <(
  grep -E '^[[:space:]]*(V[0-9]+(\.[0-9]+)? )?Signer[ :(#].*certificate SHA-256 digest: [0-9a-fA-F]{64}' <<< "$signer_report" \
    | sed -E 's/.*certificate SHA-256 digest: ([0-9a-fA-F]{64}).*/\1/' | tr 'A-F' 'a-f' | sort -u || true
)
[ "${#signer_digests[@]}" -ge 1 ] || fail "No signer certificate found in the apksigner report (see the log group above)."
[ "${#signer_digests[@]}" -eq 1 ] || fail "The APK reports ${#signer_digests[@]} different signing certificates (${signer_digests[*]}); expected only $SIGNING_CERT_SHA256."
signer_sha256="${signer_digests[0]}"
[ "$signer_sha256" = "$SIGNING_CERT_SHA256" ] || fail "Signer certificate ($signer_sha256) is not the prepared keystore ($SIGNING_CERT_SHA256)."

if [ -f android/app/debug.keystore ]; then
  debug_sha256="$(keytool -exportcert -keystore android/app/debug.keystore -storepass android -alias androiddebugkey 2> /dev/null | sha256sum | cut -d ' ' -f 1 || true)"
  [ "$signer_sha256" != "$debug_sha256" ] || fail "The APK is signed with the public Expo debug key."
fi

abis="$(unzip -Z1 "$apk" | sed -n 's#^lib/\([^/]*\)/.*#\1#p' | sort -u | paste -sd, -)"
[ -n "$abis" ] || fail "The APK has no native libraries."

rm -rf dist
mkdir dist
cp "$apk" dist/elevari.apk
(cd dist && sha256sum elevari.apk > elevari.apk.sha256)
apk_sha256="$(cut -d ' ' -f 1 dist/elevari.apk.sha256)"
size_bytes="$(stat -c %s dist/elevari.apk)"
built_at="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
run_url="${GITHUB_SERVER_URL:-https://github.com}/${GITHUB_REPOSITORY:-unknown}/actions/runs/${GITHUB_RUN_ID:-0}"

jq -n \
  --arg package "$package_name" \
  --arg versionName "$version_name" \
  --argjson versionCode "$version_code" \
  --argjson minSdk "$min_sdk" \
  --argjson targetSdk "$target_sdk" \
  --argjson sizeBytes "$size_bytes" \
  --arg sha256 "$apk_sha256" \
  --arg signing "$SIGNING_MODE" \
  --arg signerSha256 "$signer_sha256" \
  --arg abis "$abis" \
  --arg commit "${GITHUB_SHA:-unknown}" \
  --arg ref "${GITHUB_REF_NAME:-unknown}" \
  --arg builtAt "$built_at" \
  --arg runUrl "$run_url" \
  '{package: $package, versionName: $versionName, versionCode: $versionCode, minSdk: $minSdk, targetSdk: $targetSdk,
    sizeBytes: $sizeBytes, sha256: $sha256, signing: $signing, signerSha256: $signerSha256, abis: ($abis | split(",")),
    commit: $commit, ref: $ref, builtAt: $builtAt, runUrl: $runUrl}' > dist/elevari-build.json

short_sha="${GITHUB_SHA:-unknown}"
{
  echo "# Elevari para Android (APK)"
  echo
  echo "**Versión $version_name** · build $version_code · commit \`${short_sha:0:7}\` · rama \`${GITHUB_REF_NAME:-unknown}\` · $built_at"
  echo
  if [ "$SIGNING_MODE" = test ]; then
    echo "> **Firma de prueba.** Este APK está firmado con una llave desechable. Cada compilación tiene una firma distinta,"
    echo "> así que Android no deja actualizar encima de una instalación anterior: **desinstala la versión previa antes de instalar esta**."
  else
    echo "> Firmado con la llave de publicación de Elevari: se instala como actualización encima de la versión anterior."
  fi
  echo
  echo "## Cómo instalarla"
  echo
  echo "1. Descarga \`elevari.apk\` en tu teléfono Android (Android 7.0 o superior)."
  echo "2. Ábrelo. Si Android lo pide, activa **Permitir instalar desde esta fuente** para tu navegador o gestor de archivos."
  echo "3. Toca **Instalar** y abre Elevari."
  echo
  echo "Guía con código QR: https://elevari.live/app"
  echo
  echo "## Verificación"
  echo
  echo "- SHA-256 del APK: \`$apk_sha256\` (\`sha256sum -c elevari.apk.sha256\`)"
  echo "- SHA-256 del certificado de firma: \`$signer_sha256\`"
} > dist/release-notes.md

echo "APK verified: $package_name $version_name ($version_code), minSdk $min_sdk, targetSdk $target_sdk, ABIs $abis, $size_bytes bytes"
echo "SHA-256 of the APK: $apk_sha256"
echo "Permissions declared by the APK: ${permission_list:-none}"
if [ "${API_KEY_CONFIGURED:-false}" != true ]; then
  echo "::notice title=No x-api-key in this build::EXPO_PUBLIC_API_KEY is not set. If Turnstile is active on the server, sign-in and registration from the app fail with turnstile_failed. See mobile/RELEASE.md, section 'Acceso a la API desde la app'."
fi

size_mb="$(awk -v b="$size_bytes" 'BEGIN { printf "%.1f", b / 1048576 }')"
{
  echo "## APK de Elevari"
  echo
  if [ "$SIGNING_MODE" = test ]; then
    echo "> [!WARNING]"
    echo "> **Firma de PRUEBA.** Este APK está firmado con una llave desechable generada en esta ejecución."
    echo "> Cada compilación tiene una firma distinta: Android no permite actualizar encima de otra instalación."
    echo "> **Desinstala la versión anterior antes de instalar esta.** Para una firma estable, configura los secretos"
    echo "> \`ANDROID_KEYSTORE_*\` (ver \`mobile/RELEASE.md\`, sección «Firma estable»)."
    echo
  else
    echo "> Firmado con la llave de publicación configurada: las actualizaciones se instalan encima de la versión anterior."
    echo
  fi
  echo "| Dato | Valor |"
  echo "| --- | --- |"
  echo "| Paquete | \`$package_name\` |"
  echo "| Versión | $version_name (código $version_code) |"
  echo "| Android | mínimo API $min_sdk, objetivo API $target_sdk |"
  echo "| Arquitecturas | $abis |"
  echo "| Permisos declarados | ${permission_list:-ninguno} |"
  if [ "${API_KEY_CONFIGURED:-false}" = true ]; then
    echo "| Clave \`x-api-key\` de la app | configurada |"
  else
    echo "| Clave \`x-api-key\` de la app | **no configurada**: si Turnstile está activo en producción, iniciar sesión y registrarse fallará (\`mobile/RELEASE.md\`, «Acceso a la API desde la app») |"
  fi
  echo "| Tamaño | $size_mb MB |"
  echo "| Firma | $SIGNING_MODE |"
  echo "| SHA-256 del certificado de firma | \`$signer_sha256\` |"
  echo "| SHA-256 del APK | \`$apk_sha256\` |"
  echo "| Commit | \`${GITHUB_SHA:-unknown}\` |"
} >> "${GITHUB_STEP_SUMMARY:-/dev/null}"
