import * as Google from 'expo-auth-session/providers/google';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';

import { signInWithGoogleIdToken } from '@/features/auth/services/authService';
import { mapAuthError } from '@/features/auth/utils/mapAuthError';
import { AppButton, AppText } from '@/shared/components/ui';
import {
  getGoogleIdTokenClientIds,
  isGoogleSignInConfigured,
  isGoogleWebClientConfigured,
} from '@/shared/config/googleAuthEnv';

function GoogleSignInInner() {
  const ids = getGoogleIdTokenClientIds();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const lastProcessedIdToken = useRef<string | null>(null);

  const [request, response, promptAsync] = Google.useIdTokenAuthRequest(
    {
      webClientId: ids.webClientId,
      iosClientId: ids.iosClientId,
      androidClientId: ids.androidClientId,
      selectAccount: true,
    },
    { scheme: 'acts', path: 'oauthredirect' },
  );

  useEffect(() => {
    if (__DEV__ && request?.redirectUri) {
      // Add this exact URI to Google Cloud → Web client → Authorized redirect URIs (often `com.FrogCOO.Acts:/oauthredirect` for dev builds).
      console.warn('[Acts Google Auth] redirectUri → register on Web OAuth client:', request.redirectUri);
    }
  }, [request?.redirectUri]);

  useEffect(() => {
    if (!response) {
      return;
    }
    if (response.type === 'error') {
      setLocalError(mapAuthError(new Error(response.error?.message ?? 'Google sign-in failed')));
      return;
    }
    if (response.type !== 'success') {
      return;
    }
    const idToken =
      (response.params.id_token as string | undefined) ?? response.authentication?.idToken;
    if (!idToken) {
      setLocalError('Google did not return an ID token. Check your Web client ID in Firebase.');
      return;
    }
    if (lastProcessedIdToken.current === idToken) {
      return;
    }
    lastProcessedIdToken.current = idToken;

    let cancelled = false;
    setBusy(true);
    void (async () => {
      try {
        await signInWithGoogleIdToken(idToken);
        if (!cancelled) {
          router.replace('/(app)');
        }
      } catch (e) {
        if (!cancelled) {
          setLocalError(mapAuthError(e));
        }
      } finally {
        if (!cancelled) {
          setBusy(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [response, router]);

  return (
    <>
      {localError ? (
        <AppText variant="caption" className="mb-3 text-acts-danger">
          {localError}
        </AppText>
      ) : null}
      <AppButton
        title="Continue with Google"
        variant="secondary"
        disabled={!request}
        loading={busy}
        onPress={() => {
          setLocalError(null);
          void promptAsync();
        }}
      />
    </>
  );
}

function GoogleNativeClientHint() {
  if (Platform.OS === 'ios' && isGoogleWebClientConfigured() && !process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID?.trim()) {
    return (
      <AppText variant="caption" className="mt-2 text-acts-muted">
        Add EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID to .env (see Google Cloud OAuth).
      </AppText>
    );
  }
  if (
    Platform.OS === 'android' &&
    isGoogleWebClientConfigured() &&
    !process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID?.trim()
  ) {
    return (
      <AppText variant="caption" className="mt-2 text-acts-muted">
        Add EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID to .env (see Google Cloud OAuth).
      </AppText>
    );
  }
  return null;
}

export function GoogleSignInSection() {
  if (!isGoogleWebClientConfigured()) {
    return null;
  }

  if (!isGoogleSignInConfigured()) {
    return <GoogleNativeClientHint />;
  }

  return <GoogleSignInInner />;
}
