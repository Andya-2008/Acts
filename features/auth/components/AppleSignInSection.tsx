import * as AppleAuthentication from 'expo-apple-authentication';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { View } from 'react-native';

import { signInWithApple } from '@/features/auth/services/authService';
import { mapAuthError } from '@/features/auth/utils/mapAuthError';
import { AppText } from '@/shared/components/ui';

export type AppleSignInButtonIntent = 'sign-in' | 'sign-up' | 'continue';

type AppleSignInSectionProps = {
  intent?: AppleSignInButtonIntent;
};

function buttonTypeForIntent(intent: AppleSignInButtonIntent): AppleAuthentication.AppleAuthenticationButtonType {
  if (intent === 'sign-up') {
    return AppleAuthentication.AppleAuthenticationButtonType.SIGN_UP;
  }
  if (intent === 'continue') {
    return AppleAuthentication.AppleAuthenticationButtonType.CONTINUE;
  }
  return AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN;
}

export function AppleSignInSection({ intent = 'sign-in' }: AppleSignInSectionProps) {
  const router = useRouter();
  const [available, setAvailable] = useState<boolean | null>(null);
  const [busy, setBusy] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void AppleAuthentication.isAvailableAsync().then((ok) => {
      if (!cancelled) {
        setAvailable(ok);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  if (available === false) {
    return null;
  }

  const handlePress = () => {
    setLocalError(null);
    setBusy(true);
    void (async () => {
      try {
        await signInWithApple();
        router.replace('/(app)');
      } catch (error) {
        if (error instanceof Error && error.message === 'ERR_REQUEST_CANCELED') {
          return;
        }
        setLocalError(mapAuthError(error));
      } finally {
        setBusy(false);
      }
    })();
  };

  return (
    <View className="mb-3 w-full">
      {localError ? (
        <AppText variant="caption" className="mb-3 text-acts-danger">
          {localError}
        </AppText>
      ) : null}
      <AppleAuthentication.AppleAuthenticationButton
        buttonType={buttonTypeForIntent(intent)}
        buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
        cornerRadius={4}
        style={{ width: '100%', height: 52, opacity: busy || available === null ? 0.55 : 1 }}
        onPress={busy || available === null ? () => {} : handlePress}
      />
    </View>
  );
}
