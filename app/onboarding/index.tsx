import { Redirect, router } from 'expo-router';
import { useEffect, useRef } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { useQueryClient } from '@tanstack/react-query';

import { signOutCurrentUser } from '@/features/auth/services/authService';
import { useUserInfoQuery } from '@/features/user-profile/hooks/useUserInfoQuery';
import { userInfoQueryKeys } from '@/features/user-profile/queryKeys';
import { AppText, Screen } from '@/shared/components/ui';
import { useAuthStore } from '@/shared/stores/authStore';

/**
 * Legacy route: personalization now lives on the Profile tab. Keep this screen so old links still work.
 */
export default function OnboardingRedirectScreen() {
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const authReady = useAuthStore((s) => s.authReady);
  const { data, isLoading } = useUserInfoQuery(user?.uid);
  const missingProfileHandled = useRef(false);

  useEffect(() => {
    if (!authReady || !user) {
      return;
    }
    if (isLoading) {
      return;
    }
    if (data != null) {
      return;
    }
    if (missingProfileHandled.current) {
      return;
    }
    missingProfileHandled.current = true;

    void (async () => {
      queryClient.removeQueries({ queryKey: userInfoQueryKeys.all });
      useAuthStore.getState().setLoginFlash('profile_missing');
      await signOutCurrentUser();
      router.replace('/(auth)/login');
    })();
  }, [authReady, user, isLoading, data, queryClient]);

  if (!authReady || !user) {
    return <Redirect href="/(auth)/login" />;
  }

  if (isLoading) {
    return (
      <Screen>
        <View className="flex-1 items-center justify-center gap-3">
          <ActivityIndicator size="large" color="#3D8B6E" />
          <AppText variant="caption">Loading…</AppText>
        </View>
      </Screen>
    );
  }

  if (!data) {
    return (
      <Screen>
        <View className="flex-1 items-center justify-center gap-3">
          <ActivityIndicator size="large" color="#3D8B6E" />
          <AppText variant="caption">Signing you out…</AppText>
        </View>
      </Screen>
    );
  }

  if (data.UserConfig === true) {
    return <Redirect href="/(app)/(tabs)/tasks" />;
  }

  return <Redirect href="/(app)/(tabs)/profile" />;
}
