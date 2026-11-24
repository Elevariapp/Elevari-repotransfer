/**
 * Where people can get the Elevari Android app. This module only holds the addresses and the
 * switches; callers decide when a link is safe to show, so the site never links to a dead page:
 *  - Google Play: only when NEXT_PUBLIC_PLAY_STORE_LIVE=1 (set it once the listing is public).
 *  - APK: only when the build metadata of the published release can be read (lib/apk-info.ts).
 */
export const ANDROID_PACKAGE = 'elevari.androidapp';

export const PLAY_STORE_URL = `https://play.google.com/store/apps/details?id=${ANDROID_PACKAGE}`;
export const PLAY_STORE_LIVE = process.env.NEXT_PUBLIC_PLAY_STORE_LIVE === '1';

/** The web page that explains the installation (also what the QR code on that page points to). */
export const INSTALL_PAGE_PATH = '/app';

// The "mobile-apk" workflow republishes these assets under a fixed tag on every run from b-main.
const RELEASE_REPO = 'Elevariapp/Elevari-repotransfer';
const RELEASE_TAG = 'android-latest';
const RELEASE_DOWNLOAD_BASE = `https://github.com/${RELEASE_REPO}/releases/download/${RELEASE_TAG}`;

export const APK_URL = `${RELEASE_DOWNLOAD_BASE}/elevari.apk`;
export const APK_INFO_URL = `${RELEASE_DOWNLOAD_BASE}/elevari-build.json`;
export const APK_RELEASE_PAGE_URL = `https://github.com/${RELEASE_REPO}/releases/tag/${RELEASE_TAG}`;
