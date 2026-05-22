import * as Google from 'expo-auth-session/providers/google';
import { useRouter } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';

import {
  GoogleSignInButton,
  type GoogleSignInButtonIntent,
} from '@/features/auth/components/GoogleSignInButton';
import { signInWithGoogleIdToken } from '@/features/auth/services/authService';
import { mapAuthError } from '@/features/auth/utils/mapAuthError';
import { AppText } from '@/shared/components/ui';
import { getGoogleIdTokenClientIds } from '@/shared/config/googleAuthEnv';
import {
  getGoogleOAuthClientIdsForAuthRequest,
  getGoogleOAuthRedirectUri,
} from '@/shared/utils/googleOAuthRedirectUri';

type GoogleSignInSectionProps = {
  intent?: GoogleSignInButtonIntent;
};

const GOOGLE_SIGN_IN_FAILED =
  'We could not complete Google sign-in. Please try again or sign in with email and password.';

function mapGoogleError(message: string): string {
  const lower = message.toLowerCase();
  if (
    lower.includes('redirect_uri_mismatch') ||
    lower.includes('redirect uri') ||
    lower.includes('finish signing in') ||
    lower.includes('something went wrong')
  ) {
    return GOOGLE_SIGN_IN_FAILED;
  }
  return mapAuthError(new Error(message));
}

export function GoogleSignInSection({ intent = 'sign-in' }: GoogleSignInSectionProps) {
  const ids = useMemo(() => getGoogleOAuthClientIdsForAuthRequest(getGoogleIdTokenClientIds()), []);
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const lastProcessedIdToken = useRef<string | null>(null);

  const redirectUri = useMemo(() => getGoogleOAuthRedirectUri(), []);

  const [request, response, promptAsync] = Google.useIdTokenAuthRequest(
    {
      webClientId: ids.webClientId,
      iosClientId: ids.iosClientId,
      androidClientId: ids.androidClientId,
      redirectUri,
      selectAccount: true,
    },
    { scheme: 'acts', path: 'oauthredirect' },
  );

  useEffect(() => {
    if (__DEV__ && redirectUri) {
      console.warn('[Acts Google Auth] redirect URI:', redirectUri);
    }
  }, [redirectUri]);

  useEffect(() => {
    if (!response) {
      return;
    }
    if (response.type === 'error') {
      setLocalError(mapGoogleError(response.error?.message ?? 'Google sign-in failed'));
      return;
    }
    if (response.type === 'dismiss' || response.type === 'cancel') {
      return;
    }
    if (response.type !== 'success') {
      return;
    }
    const idToken =
      (response.params.id_token as string | undefined) ?? response.authentication?.idToken;
    if (!idToken) {
      if (response.params.code && !response.authentication?.idToken) {
        return;
      }
      setLocalError(GOOGLE_SIGN_IN_FAILED);
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

  const handlePress = () => {
    setLocalError(null);
    if (!request) {
      setLocalError('Google sign-in is still starting up. Wait a moment and try again.');
      return;
    }
    setBusy(true);
    void (async () => {
      try {
        const result = await promptAsync();
        if (result.type === 'error') {
          setLocalError(mapGoogleError(result.error?.message ?? 'Google sign-in failed'));
        }
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'Google sign-in failed';
        setLocalError(mapGoogleError(msg));
      } finally {
        setBusy(false);
      }
    })();
  };

  return (
    <>
      {localError ? (
        <AppText variant="caption" className="mb-3 text-acts-danger">
          {localError}
        </AppText>
      ) : null}
      <GoogleSignInButton intent={intent} loading={busy} onPress={handlePress} />
    </>
  );
}
