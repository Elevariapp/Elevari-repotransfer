// Dynamic layer over app.json. Every override is opt-in through an environment variable or an untracked file,
// so a plain `expo config` / EAS build sees exactly what app.json says.
// - GOOGLE_SERVICES_JSON: path of the Firebase file (FCM push on Android). On EAS it is a file variable; locally an
//   untracked ./google-services.json is picked up (gitignored, never commit it). Without it the app still builds and
//   Android push registration just stays inactive.
// - ANDROID_VERSION_CODE: monotonic integer for sideloaded APKs built outside EAS (EAS manages it remotely).
// - ANDROID_KEYSTORE_PATH: sign the release build with this keystore (see plugins/with-release-signing.js).
const fs = require('fs');
const path = require('path');

module.exports = ({ config }) => {
  const localFile = path.join(__dirname, 'google-services.json');
  const googleServicesFile =
    process.env.GOOGLE_SERVICES_JSON || (fs.existsSync(localFile) ? './google-services.json' : undefined);

  const versionCode = Number.parseInt(process.env.ANDROID_VERSION_CODE ?? '', 10);
  const hasVersionCode = Number.isInteger(versionCode) && versionCode > 0 && versionCode <= 2100000000;

  const plugins = process.env.ANDROID_KEYSTORE_PATH
    ? [...(config.plugins ?? []), './plugins/with-release-signing']
    : config.plugins;

  return {
    ...config,
    plugins,
    android: {
      ...config.android,
      ...(googleServicesFile ? { googleServicesFile } : {}),
      ...(hasVersionCode ? { versionCode } : {}),
    },
  };
};
