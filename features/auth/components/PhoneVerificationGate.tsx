import { Redirect, useSegments, type Href } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';

import { useRequiresPhoneVerification } from '@/features/auth/hooks/useRequiresPhoneVerification';
import { AppText, Screen } from '@/shared/components/ui';
import { useAuthStore } from '@/shared/stores/authStore';

type PhoneVerificationGateProps = {
  children: React.ReactNode;
};

/** Redirects users who lack both an Auth-verified phone and a saved profile phone to verify-phone. */
export function PhoneVerificationGate({ children }: PhoneVerificationGateProps) {
  const uid = useAuthStore((s) => s.user?.uid);
  const segments = useSegments();
  const segmentsArr = segments as string[];
  const onVerifyPhoneScreen = segmentsArr.includes('verify-phone');
  const { ready, required } = useRequiresPhoneVerification(uid);

  if (!uid) {
    return <>{children}</>;
  }

  if (!ready) {
    return (
      <Screen>
        <View className="flex-1 items-center justify-center gap-3 px-6">
          <ActivityIndicator size="large" color="#3D8B6E" />
          <AppText variant="caption" className="text-center text-acts-muted">
            Loading…
          </AppText>
        </View>
      </Screen>
    );
  }

  if (required && !onVerifyPhoneScreen) {
    return <Redirect href={'/(app)/verify-phone' as Href} />;
  }

  return <>{children}</>;
}
