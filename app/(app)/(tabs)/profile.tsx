import { Alert, KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';
import { useMemo, useState } from 'react';

import { useQueryClient } from '@tanstack/react-query';
import { router, type Href } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { deleteDeveloperAccount, signOutCurrentUser } from '@/features/auth/services/authService';
import { mapAuthError } from '@/features/auth/utils/mapAuthError';
import { OnboardingWizard } from '@/features/onboarding/components/OnboardingWizard';
import { mapUserInfoToWizardDefaults } from '@/features/onboarding/utils/mapUserInfoToWizardDefaults';
import { ProfileHeroSection } from '@/features/user-profile/components/ProfileHeroSection';
import { ProfileSettingsMenu } from '@/features/user-profile/components/ProfileSettingsMenu';
import { useUserInfoQuery } from '@/features/user-profile/hooks/useUserInfoQuery';
import { userInfoQueryKeys } from '@/features/user-profile/queryKeys';
import { computeCompletionStreak } from '@/features/user-profile/utils/computeCompletionStreak';
import { useTasksQuery } from '@/features/tasks/hooks/useTasksQueries';
import { becomeCategoryOptions } from '@/shared/config/becomeCategories';
import { AppButton, AppCard, AppText } from '@/shared/components/ui';
import { useAuthStore } from '@/shared/stores/authStore';
import { useCurrencyStore } from '@/shared/stores/currencyStore';

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const { data: userInfo } = useUserInfoQuery(user?.uid);
  const { data: tasks = [] } = useTasksQuery(user?.uid);
  const kindnessPoints = useCurrencyStore((s) => s.balance);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [showPersonalizationEditor, setShowPersonalizationEditor] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const streak = useMemo(() => computeCompletionStreak(tasks), [tasks]);
  const actsCompleted = useMemo(() => tasks.filter((t) => t.completedAt != null).length, [tasks]);

  const personalizationEditDefaults = useMemo(
    () => (userInfo ? mapUserInfoToWizardDefaults(userInfo) : null),
    [userInfo],
  );

  const becomeTitle =
    userInfo?.BecomeCategory &&
    becomeCategoryOptions.find((o) => o.id === userInfo.BecomeCategory)?.title;

  const needsPersonalization = Boolean(user?.uid && userInfo && userInfo.UserConfig === false);
  const canEditPersonalization = Boolean(user?.uid && userInfo && userInfo.UserConfig === true);

  const handleLogout = async () => {
    setSettingsOpen(false);
    queryClient.removeQueries({ queryKey: userInfoQueryKeys.all });
    await signOutCurrentUser();
    router.replace('/(auth)/login');
  };

  const runDeveloperAccountDelete = async () => {
    setDeleteError(null);
    setDeleteBusy(true);
    try {
      await deleteDeveloperAccount();
      setUser(null);
      queryClient.removeQueries({ queryKey: userInfoQueryKeys.all });
      router.replace('/(auth)/login');
    } catch (error) {
      setDeleteError(mapAuthError(error));
    } finally {
      setDeleteBusy(false);
    }
  };

  const confirmDeveloperAccountDelete = () => {
    Alert.alert(
      'Delete account (dev)',
      'Removes this Auth user and your userInfo document.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => void runDeveloperAccountDelete(),
        },
      ],
    );
  };

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
              kindnessPoints={kindnessPoints}
              actsCompleted={actsCompleted}
              onPressSettings={() => setSettingsOpen(true)}
            />
          </View>

          <View className="-mt-4 flex-1 rounded-t-3xl bg-acts-canvas px-5 pb-2 pt-6">
            {!needsPersonalization ? (
              <AppCard className="mb-5 border-acts-green/25">
                <AppText variant="subtitle" className="mb-1 text-acts-ink">
                  Today on Acts
                </AppText>
                <View className="flex-row flex-wrap gap-2">
                  <AppButton
                    title="Tasks"
                    className="min-w-[44%] flex-1"
                    onPress={() => router.push('/(app)/(tabs)/tasks' as Href)}
                  />
                  <AppButton
                    title="Deed feed"
                    variant="secondary"
                    className="min-w-[44%] flex-1"
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
                      onPress={() => setShowPersonalizationEditor(false)}
                    />
                  </View>
                ) : (
                  <AppButton
                    title="Edit choices"
                    variant="secondary"
                    className="w-full"
                    onPress={() => setShowPersonalizationEditor(true)}
                  />
                )}
              </AppCard>
            ) : null}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <ProfileSettingsMenu
        visible={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        user={user}
        becomeTitle={becomeTitle ?? null}
        deleteBusy={deleteBusy}
        deleteError={deleteError}
        onLogout={() => void handleLogout()}
        onConfirmDeleteAccount={confirmDeveloperAccountDelete}
      />
    </SafeAreaView>
  );
}
