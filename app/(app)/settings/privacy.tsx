import { useState } from 'react';
import { Alert, View } from 'react-native';
import { sendPasswordResetEmail } from 'firebase/auth';

import { FriendsOrMeRow, YesNoRow } from '@/features/settings/components/SettingsRows';
import { useMergeActsSettingsMutation } from '@/features/user-profile/hooks/useUserInfoMutations';
import { useUserInfoQuery } from '@/features/user-profile/hooks/useUserInfoQuery';
import { mergeActsDefaults } from '@/shared/types/actsSettings';
import type { ActsAppSettings } from '@/shared/types/actsSettings';
import { AppButton, AppText, Screen } from '@/shared/components/ui';
import { getFirebaseAuth } from '@/shared/services/firebase/client';
import { useAuthStore } from '@/shared/stores/authStore';

export default function SettingsPrivacyScreen() {
  const uid = useAuthStore((s) => s.user?.uid);
  const user = useAuthStore((s) => s.user);
  const { data: userInfo } = useUserInfoQuery(uid);
  const mutation = useMergeActsSettingsMutation(uid);
  const base = mergeActsDefaults(userInfo?.ActsSettings);
  const [pwBusy, setPwBusy] = useState(false);

  const patch = (p: Partial<ActsAppSettings>) => {
    void mutation.mutateAsync(p);
  };

  const hasPasswordProvider = Boolean(user?.providerData?.some((p) => p.providerId === 'password'));
  const authLabel = user?.providerData?.map((p) => p.providerId).join(', ') || '—';

  const changePassword = async () => {
    const email = user?.email?.trim();
    if (!email || !hasPasswordProvider) {
      Alert.alert('Change password', 'Password reset is available for email/password accounts.');
      return;
    }
    setPwBusy(true);
    try {
      await sendPasswordResetEmail(getFirebaseAuth(), email);
      Alert.alert('Check your email', 'We sent a link to reset your password.');
    } catch (e) {
      Alert.alert('Could not send reset', e instanceof Error ? e.message : 'Try again later.');
    } finally {
      setPwBusy(false);
    }
  };

  return (
    <Screen scroll>
      <View className="pb-8">
        <View className="mb-4 border-b border-acts-border pb-4">
          <AppText variant="subtitle" className="mb-1 text-acts-ink">
            Authenticated with
          </AppText>
          <AppText variant="caption" className="text-acts-muted">
            {authLabel}
          </AppText>
          {user?.email ? (
            <AppText variant="caption" className="mt-1 text-acts-ink">
              {user.email}
            </AppText>
          ) : null}
        </View>

        <AppButton
          title="Change Password"
          variant="secondary"
          loading={pwBusy}
          disabled={pwBusy || !hasPasswordProvider}
          onPress={() => void changePassword()}
          className="mb-6"
        />

        <AppText variant="title" className="mb-2 text-acts-ink">
          Profile Visibility
        </AppText>

        <FriendsOrMeRow
          label="Deed Feed"
          value={base.deedFeedVisibility}
          onPick={(v) => patch({ deedFeedVisibility: v })}
          disabled={mutation.isPending}
        />
        <FriendsOrMeRow
          label="Task History"
          value={base.taskHistoryVisibility}
          onPick={(v) => patch({ taskHistoryVisibility: v })}
          disabled={mutation.isPending}
        />
        <YesNoRow
          label="Allow friend requests"
          value={base.allowFriendRequests}
          onPick={(v) => patch({ allowFriendRequests: v })}
          disabled={mutation.isPending}
        />
        <YesNoRow
          label="Feed Sharing"
          value={base.feedSharing}
          onPick={(v) => patch({ feedSharing: v })}
          disabled={mutation.isPending}
        />
        <YesNoRow
          label="Reactions"
          value={base.reactionsEnabled}
          onPick={(v) => patch({ reactionsEnabled: v })}
          disabled={mutation.isPending}
        />
      </View>
    </Screen>
  );
}
