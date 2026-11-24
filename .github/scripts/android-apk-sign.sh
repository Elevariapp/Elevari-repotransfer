#!/usr/bin/env bash
# Resolves the keystore that signs the sideloaded Android APK and exports it to the following steps.
#
#   ANDROID_KEYSTORE_BASE64 + ANDROID_KEYSTORE_PASSWORD + ANDROID_KEY_ALIAS (+ ANDROID_KEY_PASSWORD, defaults to the
#   store password): the owner's real release key. Updates install in place.
#   None of them: a throwaway keystore generated inside this job. TEST signature: every build gets a different key,
#   so Android refuses to update an installed copy and the previous app must be uninstalled first.
#   Anything in between is an error: a typo in a secret must never silently produce a throwaway-signed APK.
#
# Reads the ANDROID_* variables from the environment, writes ANDROID_KEYSTORE_PATH, ANDROID_KEYSTORE_PASSWORD,
# ANDROID_KEY_ALIAS, ANDROID_KEY_PASSWORD, SIGNING_MODE (release | test) and SIGNING_CERT_SHA256 to $GITHUB_ENV.
# No secret value is ever printed.
set -euo pipefail

: "${RUNNER_TEMP:?RUNNER_TEMP is not set; run this inside GitHub Actions}"
: "${GITHUB_ENV:?GITHUB_ENV is not set; run this inside GitHub Actions}"

keystore="$RUNNER_TEMP/elevari-release.keystore"

present=()
missing=()
for name in ANDROID_KEYSTORE_BASE64 ANDROID_KEYSTORE_PASSWORD ANDROID_KEY_ALIAS; do
  if [ -n "${!name:-}" ]; then present+=("$name"); else missing+=("$name"); fi
done
if [ -n "${ANDROID_KEY_PASSWORD:-}" ]; then present+=(ANDROID_KEY_PASSWORD); fi

if [ "${#missing[@]}" -eq 0 ]; then
  mode='release'
elif [ "${#present[@]}" -eq 0 ]; then
  mode='test'
else
  {
    echo "::error title=Incomplete Android signing secrets::Found ${present[*]} but not ${missing[*]}. Define ANDROID_KEYSTORE_BASE64, ANDROID_KEYSTORE_PASSWORD and ANDROID_KEY_ALIAS together (ANDROID_KEY_PASSWORD is optional), or remove all of them to build with a throwaway TEST key. Steps: mobile/RELEASE.md, section 'Firma estable'."
  } >&2
  exit 1
fi

if [ "$mode" = release ]; then
  if ! printf '%s' "$ANDROID_KEYSTORE_BASE64" | base64 --decode > "$keystore" 2> /dev/null || [ ! -s "$keystore" ]; then
    echo "::error title=Invalid ANDROID_KEYSTORE_BASE64::The secret is not valid base64. Re-create it with: base64 -w0 elevari-release.keystore" >&2
    exit 1
  fi
  export ANDROID_KEYSTORE_PASSWORD ANDROID_KEY_ALIAS
  ANDROID_KEY_PASSWORD="${ANDROID_KEY_PASSWORD:-$ANDROID_KEYSTORE_PASSWORD}"
  export ANDROID_KEY_PASSWORD
else
  ANDROID_KEYSTORE_PASSWORD="$(openssl rand -hex 16)"
  echo "::add-mask::$ANDROID_KEYSTORE_PASSWORD"
  ANDROID_KEY_ALIAS=elevari-test
  ANDROID_KEY_PASSWORD="$ANDROID_KEYSTORE_PASSWORD"
  export ANDROID_KEYSTORE_PASSWORD ANDROID_KEY_ALIAS ANDROID_KEY_PASSWORD
  rm -f "$keystore"
  keytool -genkeypair -storetype PKCS12 -keystore "$keystore" \
    -storepass:env ANDROID_KEYSTORE_PASSWORD -keypass:env ANDROID_KEY_PASSWORD \
    -alias "$ANDROID_KEY_ALIAS" -keyalg RSA -keysize 2048 -validity 10000 \
    -dname "CN=Elevari TEST build (throwaway key), O=Elevari, C=CO" > /dev/null 2>&1
fi

if ! keytool -list -keystore "$keystore" -storepass:env ANDROID_KEYSTORE_PASSWORD -alias "$ANDROID_KEY_ALIAS" > /dev/null 2>&1; then
  echo "::error title=Cannot open the Android keystore::keytool could not read alias '$ANDROID_KEY_ALIAS' with the given store password. Check ANDROID_KEYSTORE_PASSWORD and ANDROID_KEY_ALIAS." >&2
  exit 1
fi

cert_sha256="$(keytool -exportcert -keystore "$keystore" -storepass:env ANDROID_KEYSTORE_PASSWORD -alias "$ANDROID_KEY_ALIAS" | sha256sum | cut -d ' ' -f 1)"

{
  echo "ANDROID_KEYSTORE_PATH=$keystore"
  echo "ANDROID_KEYSTORE_PASSWORD=$ANDROID_KEYSTORE_PASSWORD"
  echo "ANDROID_KEY_ALIAS=$ANDROID_KEY_ALIAS"
  echo "ANDROID_KEY_PASSWORD=$ANDROID_KEY_PASSWORD"
  echo "SIGNING_MODE=$mode"
  echo "SIGNING_CERT_SHA256=$cert_sha256"
} >> "$GITHUB_ENV"

if [ "$mode" = test ]; then
  echo "::warning title=TEST signature::No ANDROID_KEYSTORE_* secrets are configured, so this APK is signed with a throwaway key generated in this job. Android will not update an installed copy signed with a different key: uninstall the previous app first. Configure the secrets for a stable signature (mobile/RELEASE.md)."
else
  echo "Signing with the configured release keystore (alias $ANDROID_KEY_ALIAS), certificate SHA-256 $cert_sha256"
fi
