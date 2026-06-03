/**
 * Extends static `app.json` so we can add native IDs and iOS Google OAuth URL schemes from env.
 * EAS dashboard pastes sometimes include wrapping quotes — stripEnvValue avoids invalid Firebase keys.
 * Common copy mistake: `AlzaSy` (wrong) vs `AIzaSy` (correct first letter is capital I).
 */
function stripEnvValue(v) {
  if (typeof v !== 'string') return '';
  let t = v.trim();
  if (
    (t.startsWith('"') && t.endsWith('"') && t.length >= 2) ||
    (t.startsWith("'") && t.endsWith("'") && t.length >= 2)
  ) {
    t = t.slice(1, -1).trim();
  }
  return t;
}

/** Google browser keys must start with `AIzaSy`; `AlzaSy` is a frequent I/l typo in forms. */
function normalizeFirebaseApiKey(v) {
  const t = stripEnvValue(v);
  if (t.startsWith('AlzaSy')) return `AIzaSy${t.slice(6)}`;
  return t;
}

function googleReversedScheme(clientIdEnv) {
  const raw = stripEnvValue(clientIdEnv);
  if (!raw?.endsWith('.apps.googleusercontent.com')) {
    return null;
  }
  const id = raw.replace('.apps.googleusercontent.com', '');
  return `com.googleusercontent.apps.${id}`;
}

module.exports = ({ config }) => {
  const iosGoogleScheme = googleReversedScheme(process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID);
  const androidGoogleScheme = googleReversedScheme(process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID);
  const easProjectId =
    process.env.EAS_PROJECT_ID?.trim() ||
    (typeof config.extra?.eas?.projectId === 'string' ? config.extra.eas.projectId : undefined);

  /** Baked into the native manifest so Firebase works on device (EAS / Release), not only via Metro inlining. */
  const googleExtra = {
    googleWebClientId: stripEnvValue(process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID),
    googleIosClientId: stripEnvValue(process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID),
    googleAndroidClientId: stripEnvValue(process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID),
  };

  /** Fallback matches Firebase Hosting until acts.app custom domain is connected. */
  const legalBaseUrl =
    stripEnvValue(process.env.EXPO_PUBLIC_LEGAL_BASE_URL) || 'https://acts-d7c7f.web.app';
  const legalExtra = {
    legalBaseUrl,
    privacyPolicyUrl:
      stripEnvValue(process.env.EXPO_PUBLIC_PRIVACY_POLICY_URL) || `${legalBaseUrl}/privacy`,
    termsOfServiceUrl:
      stripEnvValue(process.env.EXPO_PUBLIC_TERMS_OF_SERVICE_URL) || `${legalBaseUrl}/terms`,
    supportUrl: stripEnvValue(process.env.EXPO_PUBLIC_SUPPORT_URL) || `${legalBaseUrl}/support`,
  };

  const firebaseExtra = {
    firebaseApiKey: normalizeFirebaseApiKey(process.env.EXPO_PUBLIC_FIREBASE_API_KEY),
    firebaseApiKeyIos: normalizeFirebaseApiKey(process.env.EXPO_PUBLIC_FIREBASE_API_KEY_IOS),
    firebaseApiKeyAndroid: normalizeFirebaseApiKey(process.env.EXPO_PUBLIC_FIREBASE_API_KEY_ANDROID),
    firebaseAuthDomain: stripEnvValue(process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN),
    firebaseProjectId: stripEnvValue(process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID),
    firebaseStorageBucket: stripEnvValue(process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET),
    firebaseMessagingSenderId: stripEnvValue(process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID),
    firebaseAppId: stripEnvValue(process.env.EXPO_PUBLIC_FIREBASE_APP_ID),
  };

  const plugins = [...(config.plugins ?? [])];
  if (!plugins.includes('expo-dev-client')) {
    plugins.push('expo-dev-client');
  }
  // Sentry native config (crash reporting). Sourcemap upload during EAS build is
  // skipped automatically unless SENTRY_AUTH_TOKEN + org/project are provided.
  if (!plugins.some((p) => p === '@sentry/react-native' || (Array.isArray(p) && p[0] === '@sentry/react-native'))) {
    const sentryOrg = stripEnvValue(process.env.SENTRY_ORG);
    const sentryProject = stripEnvValue(process.env.SENTRY_PROJECT);
    plugins.push(
      sentryOrg && sentryProject
        ? ['@sentry/react-native', { organization: sentryOrg, project: sentryProject }]
        : '@sentry/react-native',
    );
  }

  return {
    ...config,
    plugins,
    extra: {
      ...(config.extra ?? {}),
      ...googleExtra,
      ...firebaseExtra,
      ...legalExtra,
      eas: {
        ...(config.extra?.eas ?? {}),
        ...(easProjectId ? { projectId: easProjectId } : {}),
      },
    },
    ios: {
      ...config.ios,
      bundleIdentifier: 'com.FrogCOO.Acts',
      infoPlist: {
        ...config.ios?.infoPlist,
        NSUserNotificationUsageDescription:
          'Acts can send optional reminders about your daily acts, streak, and friends.',
        CFBundleURLTypes: [
          ...(config.ios?.infoPlist?.CFBundleURLTypes ?? []),
          {
            CFBundleURLName: 'Acts deep link',
            CFBundleURLSchemes: ['acts'],
          },
          {
            CFBundleURLName: 'OAuth redirect',
            CFBundleURLSchemes: ['com.FrogCOO.Acts'],
          },
          ...(iosGoogleScheme
            ? [
                {
                  CFBundleURLName: 'Google OAuth iOS',
                  CFBundleURLSchemes: [iosGoogleScheme],
                },
              ]
            : []),
        ],
      },
    },
    android: {
      ...config.android,
      package: 'com.FrogCOO.Acts',
      intentFilters: [
        {
          action: 'VIEW',
          autoVerify: false,
          data: [
            { scheme: 'acts', pathPrefix: '/oauthredirect' },
            { scheme: 'com.FrogCOO.Acts', pathPrefix: '/oauthredirect' },
          ],
          category: ['BROWSABLE', 'DEFAULT'],
        },
        ...(iosGoogleScheme
          ? [
              {
                action: 'VIEW',
                data: [{ scheme: iosGoogleScheme, pathPrefix: '/oauthredirect' }],
                category: ['BROWSABLE', 'DEFAULT'],
              },
            ]
          : []),
        ...(androidGoogleScheme && androidGoogleScheme !== iosGoogleScheme
          ? [
              {
                action: 'VIEW',
                data: [{ scheme: androidGoogleScheme, pathPrefix: '/oauthredirect' }],
                category: ['BROWSABLE', 'DEFAULT'],
              },
            ]
          : []),
      ],
    },
  };
};
