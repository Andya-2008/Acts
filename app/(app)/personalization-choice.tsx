import { useQueryClient } from '@tanstack/react-query';
import { Redirect, router, type Href } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { skipPersonalization } from '@/features/onboarding/services/submitOnboarding';
import { useUserInfoQuery } from '@/features/user-profile/hooks/useUserInfoQuery';
import { userInfoQueryKeys } from '@/features/user-profile/queryKeys';
import { mapAuthError } from '@/features/auth/utils/mapAuthError';
import { AppButton, AppCard, AppText, FadeInView, Screen } from '@/shared/components/ui';
import { useAuthStore } from '@/shared/stores/authStore';

/**
 * Shown after sign-up (or any sign-in) when `userInfo.UserConfig` is still false.
 * Offers a quick 2-step setup, full questionnaire, or skip without blocking every launch.
 */
export default function PersonalizationChoiceScreen() {
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const { data: userInfo, isPending } = useUserInfoQuery(user?.uid);
  const [skipping, setSkipping] = useState(false);
  const [skipError, setSkipError] = useState<string | null>(null);

  if (!user) {
    return <Redirect href="/(auth)/login" />;
  }

  if (isPending || userInfo == null) {
    return (
      <Screen scroll={false}>
        <View className="flex-1 items-center justify-center px-6">
          <AppText variant="caption" className="text-center text-acts-muted">
            Loading…
          </AppText>
        </View>
      </Screen>
    );
  }

  if (userInfo.UserConfig !== false) {
    return <Redirect href="/(app)/(tabs)/tasks" />;
  }

  const onSkip = () => {
    if (!user.uid) {
      return;
    }
    setSkipError(null);
    setSkipping(true);
    void skipPersonalization(user.uid)
      .then(async () => {
        await queryClient.invalidateQueries({ queryKey: userInfoQueryKeys.detail(user.uid!) });
        router.replace('/(app)/(tabs)/tasks' as Href);
      })
      .catch((e) => {
        setSkipError(mapAuthError(e));
      })
      .finally(() => {
        setSkipping(false);
      });
  };

  return (
    <Screen scroll scrollContentContainerStyle={{ justifyContent: 'center' }}>
      <FadeInView>
        <View className="py-6">
          <AppText variant="title" className="mb-2 text-acts-ink">
            Get acts picked for you?
          </AppText>
          <AppText variant="body" className="mb-5 leading-6 text-acts-muted">
            A quick setup helps Acts suggest deeds that match your interests and preferred difficulty on
            your Tasks list.
          </AppText>

          <AppCard className="mb-4">
            <AppButton
              title="Quick setup (~30 sec)"
              className="w-full"
              onPress={() => router.replace('/(app)/(tabs)/profile' as Href)}
            />
            <AppButton
              title="Full questionnaire"
              variant="secondary"
              className="mt-3 w-full"
              onPress={() => router.replace('/(app)/settings/personalization' as Href)}
            />
            <AppButton
              title="Not now"
              variant="ghost"
              className="mt-2 w-full"
              disabled={skipping}
              loading={skipping}
              onPress={onSkip}
            />
          </AppCard>

          {skipError ? (
            <AppText variant="caption" className="text-center text-acts-danger">
              {skipError}
            </AppText>
          ) : null}
        </View>
      </FadeInView>
    </Screen>
  );
}
