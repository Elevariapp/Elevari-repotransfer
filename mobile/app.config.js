// Dynamic layer over app.json. It only wires the Firebase file (FCM push on Android) when one exists:
// - EAS builds: GOOGLE_SERVICES_JSON is an EAS file variable and holds the path of the downloaded file.
// - Local builds: an untracked ./google-services.json is picked up (it is gitignored, never commit it).
// Without a file the app still builds; Android push registration just stays inactive.
const fs = require('fs');
const path = require('path');

module.exports = ({ config }) => {
  const localFile = path.join(__dirname, 'google-services.json');
  const googleServicesFile =
    process.env.GOOGLE_SERVICES_JSON || (fs.existsSync(localFile) ? './google-services.json' : undefined);

  if (!googleServicesFile) return config;

  return { ...config, android: { ...config.android, googleServicesFile } };
};
