import Constants from 'expo-constants';
import { Platform } from 'react-native';

import { isGoogleSignInSupportedInRuntime } from '@/shared/utils/expoRuntime';

function str(v: string | undefined | null): string {
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

type GoogleAuthExtra = {
  googleWebClientId?: string;
  googleIosClientId?: string;
  googleAndroidClientId?: string;
};

function googleFromManifest(): GoogleAuthExtra {
  const fromManifest = (Constants.manifest as { extra?: GoogleAuthExtra } | null)?.extra;
  const fromExpoConfig = Constants.expoConfig?.extra as GoogleAuthExtra | undefined;
  return { ...(fromManifest ?? {}), ...(fromExpoConfig ?? {}) };
}

/** Set `EXPO_PUBLIC_GOOGLE_SIGN_IN_ENABLED=false` to hide the button without removing client IDs. */
export function isGoogleSignInUiEnabled(): boolean {
  const flag = process.env.EXPO_PUBLIC_GOOGLE_SIGN_IN_ENABLED?.trim().toLowerCase();
  if (flag === 'false' || flag === '0' || flag === 'no') {
    return false;
  }
  return true;
}

/** Login/signup: show Google block + "or" divider when sign-in can actually run. */
export function shouldShowGoogleAuthOnAuthScreens(): boolean {
  return (
    isGoogleSignInUiEnabled() &&
    isGoogleSignInSupportedInRuntime() &&
    canStartGoogleOAuthOnPlatform()
  );
}

export function getGoogleWebClientId(): string {
  const x = googleFromManifest();
  // EAS/dev builds bake IDs into expo.extra; Metro inlines process.env from local .env.
  return str(x.googleWebClientId) || str(process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID);
}

export function getGoogleIosClientId(): string {
  const x = googleFromManifest();
  return str(x.googleIosClientId) || str(process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID);
}

export function getGoogleAndroidClientId(): string {
  const x = googleFromManifest();
  return str(x.googleAndroidClientId) || str(process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID);
}

/**
 * Web client ID is always required for Firebase `GoogleAuthProvider` + token exchange.
 * For Google Cloud: add the exact `redirectUri` from __DEV__ Metro logs to the Web client
 * “Authorized redirect URIs” (often `com.FrogCOO.Acts:/oauthredirect` for dev builds).
 */
export function isGoogleWebClientConfigured(): boolean {
  return Boolean(getGoogleWebClientId());
}

export function hasNativeGoogleClientIdForPlatform(): boolean {
  if (Platform.OS === 'ios') {
    return Boolean(getGoogleIosClientId());
  }
  if (Platform.OS === 'android') {
    return Boolean(getGoogleAndroidClientId());
  }
  return true;
}

/** Native apps must not use the Web OAuth client — Google blocks that as a policy violation. */
export function canStartGoogleOAuthOnPlatform(): boolean {
  if (Platform.OS === 'web') {
    return isGoogleWebClientConfigured();
  }
  return isGoogleWebClientConfigured() && hasNativeGoogleClientIdForPlatform();
}

/** Enough config to mount `useIdTokenAuthRequest` (web-only on web; web + native on mobile). */
export function isGoogleSignInConfigured(): boolean {
  return canStartGoogleOAuthOnPlatform();
}

/**
 * Web client ID is for Firebase token validation. iOS/Android must use their own OAuth client types.
 */
export function getGoogleIdTokenClientIds(): {
  webClientId: string;
  iosClientId: string;
  androidClientId: string;
} {
  const webClientId = getGoogleWebClientId();
  if (!webClientId) {
    throw new Error('Missing EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID');
  }

  const iosClientId = getGoogleIosClientId();
  const androidClientId = getGoogleAndroidClientId();

  if (Platform.OS === 'ios' && !iosClientId) {
    throw new Error('Missing EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID');
  }
  if (Platform.OS === 'android' && !androidClientId) {
    throw new Error('Missing EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID');
  }

  return {
    webClientId,
    iosClientId: iosClientId || webClientId,
    androidClientId: androidClientId || webClientId,
  };
}
