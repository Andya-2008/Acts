/**
 * Extends static `app.json` so we can add native IDs and iOS Google OAuth URL schemes from env.
 */
function googleIosReversedScheme() {
  const raw = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID?.trim();
  if (!raw?.endsWith('.apps.googleusercontent.com')) {
    return null;
  }
  const id = raw.replace('.apps.googleusercontent.com', '');
  return `com.googleusercontent.apps.${id}`;
}

module.exports = ({ config }) => {
  const googleScheme = googleIosReversedScheme();

  return {
    ...config,
    ios: {
      ...config.ios,
      bundleIdentifier: 'com.FrogCOO.Acts',
      ...(googleScheme
        ? {
            infoPlist: {
              ...config.ios?.infoPlist,
              CFBundleURLTypes: [
                ...(config.ios?.infoPlist?.CFBundleURLTypes ?? []),
                {
                  CFBundleURLName: 'Google OAuth',
                  CFBundleURLSchemes: [googleScheme],
                },
              ],
            },
          }
        : {}),
    },
    android: {
      ...config.android,
      package: 'com.FrogCOO.Acts',
    },
  };
};
