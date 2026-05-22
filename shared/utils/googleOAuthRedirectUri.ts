import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { makeRedirectUri } from 'expo-auth-session';
// eslint-disable-next-line import/no-internal-modules -- canonical Expo Go proxy URL
import sessionUrlProvider from 'expo-auth-session/build/SessionUrlProvider';

import {
  getGoogleAndroidClientId,
  getGoogleIosClientId,
} from '@/shared/config/googleAuthEnv';
import { isExpoGoRuntime } from '@/shared/utils/expoRuntime';

/** `com.googleusercontent.apps.<id>:/oauthredirect` — required for iOS/Android OAuth clients. */
export function googleReversedClientRedirectUri(clientId: string): string | null {
  const trimmed = clientId.trim();
  if (!trimmed.endsWith('.apps.googleusercontent.com')) {
    return null;
  }
  const id = trimmed.replace('.apps.googleusercontent.com', '');
  return `com.googleusercontent.apps.${id}:/oauthredirect`;
}

function getExpoProjectFullName(): string | null {
  const fromConfig = Constants.expoConfig?.originalFullName?.trim();
  if (fromConfig) {
    return fromConfig;
  }
  const owner = Constants.expoConfig?.owner?.trim();
  const slug = Constants.expoConfig?.slug?.trim();
  if (owner && slug) {
    return `@${owner}/${slug}`;
  }
  return null;
}

/** HTTPS redirect for Expo Go — must be on the **Web** OAuth client's redirect URI list. */
export function getExpoAuthProxyRedirectUri(): string | null {
  const fullName = getExpoProjectFullName();
  if (!fullName) {
    return null;
  }
  try {
    return sessionUrlProvider.getRedirectUrl({ projectNameForProxy: fullName });
  } catch {
    return `https://auth.expo.io/${fullName}`;
  }
}

/**
 * Redirect URI for the Google authorize request.
 * - Expo Go: https://auth.expo.io/… (Web client)
 * - iOS/Android dev build: com.googleusercontent.apps.<native-client-id>:/oauthredirect
 */
export function getGoogleOAuthRedirectUri(): string {
  if (isExpoGoRuntime()) {
    const proxy = getExpoAuthProxyRedirectUri();
    if (proxy) {
      return proxy;
    }
  }

  if (Platform.OS === 'ios') {
    const iosRedirect = googleReversedClientRedirectUri(getGoogleIosClientId());
    if (iosRedirect) {
      return iosRedirect;
    }
  }

  if (Platform.OS === 'android') {
    const androidRedirect = googleReversedClientRedirectUri(getGoogleAndroidClientId());
    if (androidRedirect) {
      return androidRedirect;
    }
  }

  return makeRedirectUri({ scheme: 'acts', path: 'oauthredirect' });
}

/**
 * In Expo Go, OAuth must use the **Web** client ID with the auth.expo.io redirect.
 */
export function getGoogleOAuthClientIdsForAuthRequest(ids: {
  webClientId: string;
  iosClientId: string;
  androidClientId: string;
}): {
  webClientId: string;
  iosClientId: string;
  androidClientId: string;
} {
  if (!isExpoGoRuntime()) {
    return ids;
  }
  return {
    webClientId: ids.webClientId,
    iosClientId: ids.webClientId,
    androidClientId: ids.webClientId,
  };
}

export function getGoogleOAuthWebClientRedirectUris(): string[] {
  const proxy = getExpoAuthProxyRedirectUri();
  return proxy ? [proxy] : [];
}
