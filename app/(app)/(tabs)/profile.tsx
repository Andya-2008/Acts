import { KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';
import { useMemo, useState } from 'react';

import { router, type Href } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { OnboardingWizard } from '@/features/onboarding/components/OnboardingWizard';
import { mapUserInfoToWizardDefaults } from '@/features/onboarding/utils/mapUserInfoToWizardDefaults';
import { ProfileHeroSection } from '@/features/user-profile/components/ProfileHeroSection';
import { useUserInfoQuery } from '@/features/user-profile/hooks/useUserInfoQuery';
import { computeCompletionStreak } from '@/features/user-profile/utils/computeCompletionStreak';
import { useTasksQuery } from '@/features/tasks/hooks/useTasksQueries';
import { getServiceRankForLifetimeXp } from '@/features/user-profile/config/xpServiceRanks';
import { AppButton, AppCard, AppText } from '@/shared/components/ui';
import { mergeActsDefaults } from '@/shared/types/actsSettings';
import { useAuthStore } from '@/shared/stores/authStore';
import { useCurrencyStore } from '@/shared/stores/currencyStore';

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const user = useAuthStore((s) => s.user);
  const { data: userInfo } = useUserInfoQuery(user?.uid);
  const { data: tasks = [] } = useTasksQuery(user?.uid);
  const kindnessPoints = useCurrencyStore((s) => s.balance);
  const lifetimeXp = useMemo(
    () => Math.max(0, Math.floor(Number(userInfo?.LifetimeXP ?? 0))),
    [userInfo?.LifetimeXP],
  );
  const serviceRank = useMemo(() => getServiceRankForLifetimeXp(lifetimeXp), [lifetimeXp]);
  const [showPersonalizationEditor, setShowPersonalizationEditor] = useState(false);

  const streak = useMemo(
    () => computeCompletionStreak(tasks, mergeActsDefaults(userInfo?.ActsSettings)),
    [tasks, userInfo?.ActsSettings],
  );
  const actsCompleted = useMemo(() => tasks.filter((t) => t.completedAt != null).length, [tasks]);

  const personalizationEditDefaults = useMemo(
    () => (userInfo ? mapUserInfoToWizardDefaults(userInfo) : null),
    [userInfo],
  );

  const needsPersonalization = Boolean(user?.uid && userInfo && userInfo.UserConfig === false);
  const canEditPersonalization = Boolean(user?.uid && userInfo && userInfo.UserConfig === true);

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
            paddingBottom: Math.max(insets.bottom, 12) + 8,
          }}>
          <View className="bg-acts-green" style={{ paddingTop: insets.top }}>
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
          </View>

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
                    title="Deed feed"
                    variant="secondary"
                    className="min-w-[48%] flex-1"
                    accessibilityLabel="Open deed feed tab"
                    onPress={() => router.push('/(app)/(tabs)/deed-feed' as Href)}
                  />
                </View>
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

            {canEditPersonalization && user && personalizationEditDefaults ? (
              <AppCard className="mb-2">
                <AppText variant="subtitle" className="mb-2">
                  Your personalization
                </AppText>
                {showPersonalizationEditor ? (
                  <View>
                    <OnboardingWizard
                      key="profile-personalization-editor"
                      userId={user.uid}
                      layout="embedded"
                      variant="edit"
                      personalizationDefaults={personalizationEditDefaults}
                      onSaved={() => setShowPersonalizationEditor(false)}
                    />
                    <AppButton
                      title="Cancel"
                      variant="ghost"
                      className="mt-4 w-full"
                      accessibilityLabel="Cancel editing personalization"
                      onPress={() => setShowPersonalizationEditor(false)}
                    />
                  </View>
                ) : (
                  <AppButton
                    title="Edit choices"
                    variant="secondary"
                    className="w-full"
                    accessibilityLabel="Edit personalization choices"
                    onPress={() => setShowPersonalizationEditor(true)}
                  />
                )}
              </AppCard>
            ) : null}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
