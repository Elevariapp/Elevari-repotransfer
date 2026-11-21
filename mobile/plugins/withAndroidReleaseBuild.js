const { withAppBuildGradle } = require('expo/config-plugins');

const MARKER = '// elevari-release-build';
const GUARD_MARKER = '// elevari-release-guard';

const SIGNING_BLOCK = `
        release {
            ${MARKER}
            if (project.hasProperty('ELEVARI_UPLOAD_STORE_FILE')) {
                storeFile file(project.property('ELEVARI_UPLOAD_STORE_FILE'))
                storePassword project.property('ELEVARI_UPLOAD_STORE_PASSWORD')
                keyAlias project.property('ELEVARI_UPLOAD_KEY_ALIAS')
                keyPassword project.property('ELEVARI_UPLOAD_KEY_PASSWORD')
            }
        }`;

const CMAKE_BLOCK = `
    externalNativeBuild {
        cmake {
            buildStagingDirectory "C:/b"
            version "3.31.6"
        }
    }
`;

const GUARD_BLOCK = `
${GUARD_MARKER}: release artifacts must be signed with the Elevari upload key, never debug.
gradle.taskGraph.whenReady { graph ->
    def releaseBuild = graph.allTasks.any {
        it.project == project && (it.name == 'bundleRelease' || it.name == 'assembleRelease')
    }
    if (releaseBuild && !project.hasProperty('ELEVARI_UPLOAD_STORE_FILE')) {
        throw new GradleException('Release builds require ELEVARI_UPLOAD_STORE_FILE / _STORE_PASSWORD / _KEY_ALIAS / _KEY_PASSWORD in ~/.gradle/gradle.properties (upload keystore).')
    }
}
`;

function patch(contents) {
  if (contents.includes(MARKER) && contents.includes(GUARD_MARKER)) return contents;

  if (!contents.includes(MARKER)) {
    // Release signing config: keystore is read from ~/.gradle/gradle.properties
    contents = contents.replace(
      /(signingConfigs\s*\{[\s\S]*?debug\s*\{[\s\S]*?\n\s*\})/,
      `$1${SIGNING_BLOCK}`
    );

    // Release always uses the upload key (the guard below fails the build when it is missing)
    contents = contents.replace(
      /(buildTypes\s*\{[\s\S]*?\brelease\s*\{[\s\S]*?)signingConfig signingConfigs\.debug/,
      `$1signingConfig signingConfigs.release`
    );

    // Short CMake staging dir + modern CMake/ninja to avoid Windows 260-char path failures
    if (!contents.includes('buildStagingDirectory')) {
      contents = contents.replace(/(\n\s*packagingOptions\s*\{)/, `${CMAKE_BLOCK}$1`);
    }
  }

  if (!contents.includes(GUARD_MARKER)) {
    contents = `${contents.trimEnd()}\n${GUARD_BLOCK}`;
  }
  return contents;
}

module.exports = (config) =>
  withAppBuildGradle(config, (cfg) => {
    cfg.modResults.contents = patch(cfg.modResults.contents);
    return cfg;
  });

module.exports.patch = patch;
