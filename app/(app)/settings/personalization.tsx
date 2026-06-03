import { router } from 'expo-router';
import { useMemo } from 'react';
import { ActivityIndicator, View } from 'react-native';

import { OnboardingWizard } from '@/features/onboarding/components/OnboardingWizard';
import { mapUserInfoToWizardDefaults } from '@/features/onboarding/utils/mapUserInfoToWizardDefaults';
import { useUserInfoQuery } from '@/features/user-profile/hooks/useUserInfoQuery';
import { AppText, Screen } from '@/shared/components/ui';
import { useActAppearance } from '@/shared/providers/ActAppearanceProvider';
import { useAuthStore } from '@/shared/stores/authStore';

/** Personalize Acts — set up (if not configured yet) or edit existing choices. */
export default function SettingsPersonalizationScreen() {
  const act = useActAppearance();
  const uid = useAuthStore((s) => s.user?.uid);
  const { data: userInfo, isPending } = useUserInfoQuery(uid);

  const editDefaults = useMemo(
    () => (userInfo ? mapUserInfoToWizardDefaults(userInfo) : null),
    [userInfo],
  );

  if (!uid || isPending || !userInfo) {
    return (
      <Screen>
        <View className="flex-1 items-center justify-center py-24">
          <ActivityIndicator size="large" color={act.palette.green} />
        </View>
      </Screen>
    );
  }

  const notConfigured = userInfo.UserConfig === false;

  return (
    <Screen scroll>
      <View className="pb-8 pt-1">
        <AppText variant="caption" className="mb-4 leading-5 text-acts-muted">
          {notConfigured
            ? 'Answer a few quick questions so Acts can suggest acts that fit you.'
            : 'Update your answers anytime — your suggested acts adapt to your choices.'}
        </AppText>
        {notConfigured ? (
          <OnboardingWizard
            userId={uid}
            initialPhone={userInfo.Phone ?? ''}
            initialFirst={userInfo.First ?? ''}
            initialLast={userInfo.Last ?? ''}
            layout="embedded"
          />
        ) : editDefaults ? (
          <OnboardingWizard
            key="settings-personalization-editor"
            userId={uid}
            layout="embedded"
            variant="edit"
            personalizationDefaults={editDefaults}
            onSaved={() => router.back()}
          />
        ) : null}
      </View>
    </Screen>
  );
}
