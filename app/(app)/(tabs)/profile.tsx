import { KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';
import { useMemo } from 'react';

import { router, type Href } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ScreenTopSafeArea } from '@/shared/components/ScreenTopSafeArea';

import { OnboardingWizard } from '@/features/onboarding/components/OnboardingWizard';
import { ProfileHeroSection } from '@/features/user-profile/components/ProfileHeroSection';
import { ProfileMemoriesSection } from '@/features/deed-feed/components/ProfileMemoriesSection';
import { useUserInfoQuery } from '@/features/user-profile/hooks/useUserInfoQuery';
import { computeCompletionStreak } from '@/features/user-profile/utils/computeCompletionStreak';
import { useTasksQuery } from '@/features/tasks/hooks/useTasksQueries';
import { getServiceRankForLifetimeXp } from '@/features/user-profile/config/xpServiceRanks';
import { AppButton, AppCard, AppText } from '@/shared/components/ui';
import { useActAppearance } from '@/shared/providers/ActAppearanceProvider';
import { mergeActsDefaults } from '@/shared/types/actsSettings';
import { useAuthStore } from '@/shared/stores/authStore';
import { useCurrencyStore } from '@/shared/stores/currencyStore';

export default function ProfileScreen() {
  const act = useActAppearance();
  const user = useAuthStore((s) => s.user);
  const { data: userInfo } = useUserInfoQuery(user?.uid);
  const { data: tasks = [] } = useTasksQuery(user?.uid);
  const kindnessPoints = useCurrencyStore((s) => s.balance);
  const lifetimeXp = useMemo(
    () => Math.max(0, Math.floor(Number(userInfo?.LifetimeXP ?? 0))),
    [userInfo?.LifetimeXP],
  );
  const serviceRank = useMemo(() => getServiceRankForLifetimeXp(lifetimeXp), [lifetimeXp]);

  const streak = useMemo(
    () => computeCompletionStreak(tasks, mergeActsDefaults(userInfo?.ActsSettings)),
    [tasks, userInfo?.ActsSettings],
  );
  const actsCompleted = useMemo(() => tasks.filter((t) => t.completedAt != null).length, [tasks]);

  const needsPersonalization = Boolean(user?.uid && userInfo && userInfo.UserConfig === false);

  return (
    <SafeAreaView className="flex-1 bg-acts-canvas" edges={['left', 'right', 'bottom']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1">
        <ScrollView
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          bounces
          contentContainerStyle={{
            flexGrow: 1,
            paddingBottom: 20,
          }}>
          <ScreenTopSafeArea style={{ backgroundColor: act.palette.green }} barClassName="bg-acts-green">
            <ProfileHeroSection
              user={user}
              userInfo={userInfo}
              streak={streak}
              seeds={kindnessPoints}
              lifetimeXp={lifetimeXp}
              actsCompleted={actsCompleted}
              serviceRank={serviceRank}
              onPressSettings={() => router.push('/(app)/settings' as Href)}
              onPressAchievements={() => router.push('/(app)/achievements' as Href)}
            />
          </ScreenTopSafeArea>

          <View className="-mt-4 flex-1 rounded-t-3xl bg-acts-canvas px-5 pb-2 pt-6">
            {!needsPersonalization ? (
              <AppCard className="mb-5 border-acts-green/25">
                <AppText variant="subtitle" className="mb-1 text-acts-ink">
                  Today on Acts
                </AppText>
                <View className="mt-3 flex-row flex-wrap gap-2">
                  <AppButton
                    title="Tasks"
                    className="min-w-[48%] flex-1"
                    accessibilityLabel="Open tasks tab"
                    onPress={() => router.push('/(app)/(tabs)/tasks' as Href)}
                  />
                  <AppButton
                    title="Deed Feed"
                    variant="secondary"
                    className="min-w-[48%] flex-1"
                    accessibilityLabel="Open deed feed tab"
                    onPress={() => router.push('/(app)/(tabs)/deed-feed' as Href)}
                  />
                </View>
                <View className="mt-2 flex-row flex-wrap gap-2">
                  <AppButton
                    title="Leaderboard"
                    variant="ghost"
                    className="min-w-[48%] flex-1"
                    accessibilityLabel="Open friends leaderboard"
                    onPress={() => router.push('/(app)/leaderboards' as Href)}
                  />
                  <AppButton
                    title="Challenges"
                    variant="ghost"
                    className="min-w-[48%] flex-1"
                    accessibilityLabel="Open seasonal challenges"
                    onPress={() => router.push('/(app)/challenges' as Href)}
                  />
                </View>
              </AppCard>
            ) : null}

            {!needsPersonalization && user?.uid ? (
              <AppCard className="mb-5 border-acts-green/25">
                <ProfileMemoriesSection
                  authorUid={user.uid}
                  canView
                  title="Your deeds"
                  container="embedded"
                />
              </AppCard>
            ) : null}

            {needsPersonalization && user?.uid ? (
              <AppCard className="mb-5 border-acts-green/35">
                <AppText variant="subtitle" className="mb-2">
                  Personalize Acts
                </AppText>
                <OnboardingWizard
                  userId={user.uid}
                  initialPhone={userInfo?.Phone ?? ''}
                  initialFirst={userInfo?.First ?? ''}
                  initialLast={userInfo?.Last ?? ''}
                  layout="embedded"
                />
              </AppCard>
            ) : null}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
