// Signs the Android release build with the keystore described by environment variables instead of the
// public debug key that `expo prebuild` writes into android/app/build.gradle.
// app.config.js registers this plugin only when ANDROID_KEYSTORE_PATH is set (the "Mobile APK" workflow),
// so EAS builds and everyday prebuilds are untouched. If Expo's template ever changes shape this throws
// instead of silently shipping an APK signed with the debug key.
const fs = require('fs');
const { withAppBuildGradle } = require('expo/config-plugins');

const RELEASE_SIGNING = `        release {
            storeFile file(System.getenv('ANDROID_KEYSTORE_PATH'))
            storePassword System.getenv('ANDROID_KEYSTORE_PASSWORD')
            keyAlias System.getenv('ANDROID_KEY_ALIAS')
            keyPassword System.getenv('ANDROID_KEY_PASSWORD')
        }
`;

const RELEASE_BUILD_TYPE = /(release\s*\{[^}]*?)signingConfig\s+signingConfigs\.debug/;
const SIGNING_CONFIGS_OPEN = /signingConfigs\s*\{\n/;

function patchBuildGradle(source) {
  if (source.includes('signingConfig signingConfigs.release')) return source;

  if (!RELEASE_BUILD_TYPE.test(source) || !SIGNING_CONFIGS_OPEN.test(source)) {
    throw new Error(
      'with-release-signing: could not find the release signing block in android/app/build.gradle. ' +
        "Expo's prebuild template changed; update mobile/plugins/with-release-signing.js."
    );
  }

  return source
    .replace(RELEASE_BUILD_TYPE, '$1signingConfig signingConfigs.release')
    .replace(SIGNING_CONFIGS_OPEN, (opening) => opening + RELEASE_SIGNING);
}

module.exports = function withReleaseSigning(config) {
  const keystore = process.env.ANDROID_KEYSTORE_PATH;
  if (!keystore || !fs.existsSync(keystore)) {
    throw new Error(`with-release-signing: ANDROID_KEYSTORE_PATH does not point to a file (${keystore || 'unset'}).`);
  }

  return withAppBuildGradle(config, (cfg) => {
    cfg.modResults.contents = patchBuildGradle(cfg.modResults.contents);
    return cfg;
  });
};

module.exports.patchBuildGradle = patchBuildGradle;
