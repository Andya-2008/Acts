import { Redirect, router, type Href } from 'expo-router';
import { View } from 'react-native';

import { useUserInfoQuery } from '@/features/user-profile/hooks/useUserInfoQuery';
import { AppButton, AppCard, AppText, FadeInView, Screen } from '@/shared/components/ui';
import { useAuthStore } from '@/shared/stores/authStore';

/**
 * Shown after sign-up (or any sign-in) when `userInfo.UserConfig` is still false.
 * Lets the user start the personalization wizard immediately or skip and use Acts first.
 */
export default function PersonalizationChoiceScreen() {
  const user = useAuthStore((s) => s.user);
  const { data: userInfo, isPending } = useUserInfoQuery(user?.uid);

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

  return (
    <Screen scroll scrollContentContainerStyle={{ justifyContent: 'center' }}>
      <FadeInView>
        <View className="py-6">
          <AppText variant="title" className="mb-4 text-acts-ink">
            Personalize Acts?
          </AppText>

          <AppCard className="mb-4">
            <AppButton
              title="Set preferences now"
              className="w-full"
              onPress={() => router.replace('/(app)/(tabs)/profile' as Href)}
            />
            <AppButton
              title="I'll do this later"
              variant="secondary"
              className="mt-3 w-full"
              onPress={() => router.replace('/(app)/(tabs)/tasks' as Href)}
            />
          </AppCard>
        </View>
      </FadeInView>
    </Screen>
  );
}
