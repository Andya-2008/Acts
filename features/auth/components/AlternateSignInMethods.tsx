import { View } from 'react-native';

import { AppleSignInSection, type AppleSignInButtonIntent } from '@/features/auth/components/AppleSignInSection';
import { AuthMethodDivider } from '@/features/auth/components/AuthMethodDivider';
import { GoogleSignInSection } from '@/features/auth/components/GoogleSignInSection';
import { shouldShowAppleAuthOnAuthScreens } from '@/shared/config/appleAuthEnv';
import { shouldShowGoogleAuthOnAuthScreens } from '@/shared/config/googleAuthEnv';

type AlternateSignInMethodsProps = {
  intent?: AppleSignInButtonIntent;
};

/**
 * OAuth sign-in block for login/signup. On iOS, Sign in with Apple appears above Google
 * (App Store Guideline 4.8 when offering third-party login).
 */
export function AlternateSignInMethods({ intent = 'sign-in' }: AlternateSignInMethodsProps) {
  const showApple = shouldShowAppleAuthOnAuthScreens();
  const showGoogle = shouldShowGoogleAuthOnAuthScreens();

  if (!showApple && !showGoogle) {
    return null;
  }

  return (
    <>
      <AuthMethodDivider />
      <View className="w-full">
        {showApple ? <AppleSignInSection intent={intent} /> : null}
        {showGoogle ? <GoogleSignInSection intent={intent} /> : null}
      </View>
    </>
  );
}
