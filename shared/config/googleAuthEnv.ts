import { Platform } from 'react-native';

/**
 * Web client ID is always required for Firebase `GoogleAuthProvider` + token exchange.
 * For Google Cloud: add the exact `redirectUri` from __DEV__ Metro logs to the Web client
 * “Authorized redirect URIs” (often `com.FrogCOO.Acts:/oauthredirect` for dev builds).
 */
export function isGoogleWebClientConfigured(): boolean {
  return Boolean(process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID?.trim());
}

/**
 * `expo-auth-session` requires `iosClientId` on iOS and `androidClientId` on Android
 * (see `expo-auth-session` Google provider — it picks the native client per platform).
 */
export function isGoogleSignInConfigured(): boolean {
  if (!isGoogleWebClientConfigured()) {
    return false;
  }
  if (Platform.OS === 'ios') {
    return Boolean(process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID?.trim());
  }
  if (Platform.OS === 'android') {
    return Boolean(process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID?.trim());
  }
  return true;
}

export function getGoogleIdTokenClientIds(): {
  webClientId: string;
  iosClientId?: string;
  androidClientId?: string;
} {
  const webClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID?.trim() ?? '';
  if (!webClientId) {
    throw new Error('Missing EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID');
  }
  const iosClientId = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID?.trim() || undefined;
  const androidClientId = process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID?.trim() || undefined;

  if (Platform.OS === 'ios' && !iosClientId) {
    throw new Error('Missing EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID (required on iOS for Google sign-in).');
  }
  if (Platform.OS === 'android' && !androidClientId) {
    throw new Error('Missing EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID (required on Android for Google sign-in).');
  }

  return {
    webClientId,
    iosClientId,
    androidClientId,
  };
}
