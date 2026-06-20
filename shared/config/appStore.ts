/** iOS bundle id — must match App Store Connect / `app.json`. */
export const IOS_BUNDLE_ID = 'com.FrogCOO.Acts';

/** Android application id — must match Play Console / `app.json`. */
export const ANDROID_PACKAGE = 'com.FrogCOO.Acts';

/** Public App Store listing for Acts: Be Kind. */
export const APP_STORE_URL = 'https://apps.apple.com/us/app/acts-be-kind/id6770841231';

/** Google Play listing (package id works before a custom short link exists). */
export const PLAY_STORE_URL = `https://play.google.com/store/apps/details?id=${ANDROID_PACKAGE}`;

export function getAppStoreUrl(): string {
  return APP_STORE_URL;
}

export function getPlayStoreUrl(): string {
  return PLAY_STORE_URL;
}

/** Native store listing for the current platform. */
export function getStoreUrlForPlatform(platformOs: string): string {
  if (platformOs === 'android') {
    return getPlayStoreUrl();
  }
  return getAppStoreUrl();
}
