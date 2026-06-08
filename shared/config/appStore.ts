/** iOS bundle id — must match App Store Connect / `app.json`. */
export const IOS_BUNDLE_ID = 'com.FrogCOO.Acts';

/** Public App Store listing for Acts: Be Kind. */
export const APP_STORE_URL = 'https://apps.apple.com/us/app/acts-be-kind/id6770841231';

export function getAppStoreUrl(): string {
  return APP_STORE_URL;
}
