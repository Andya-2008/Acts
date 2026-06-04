import { useState, useMemo } from 'react';
import { Alert, View } from 'react-native';
import { sendPasswordResetEmail } from 'firebase/auth';

import { FriendsOrMeRow, ThreeChoiceRow, YesNoRow } from '@/features/settings/components/SettingsRows';
import { useMergeActsSettingsMutation } from '@/features/user-profile/hooks/useUserInfoMutations';
import { useUserInfoQuery } from '@/features/user-profile/hooks/useUserInfoQuery';
import { useUnblockUserMutation } from '@/features/safety/useSafetyMutations';
import {
  mergeActsDefaults,
  PROFILE_STAT_VISIBILITY_OPTIONS,
  type ActsAppSettings,
  type ProfileStatVisibility,
} from '@/shared/types/actsSettings';
import { AppButton, AppCard, AppText, Screen, TitleWithInfo } from '@/shared/components/ui';
import { getFirebaseAuth } from '@/shared/services/firebase/client';
import { useAuthStore } from '@/shared/stores/authStore';

function BlockedAccountRow({ viewerUid, blockedUid }: { viewerUid: string; blockedUid: string }) {
  const { data } = useUserInfoQuery(blockedUid);
  const unblock = useUnblockUserMutation(viewerUid);
  const full = [data?.First, data?.Last].filter(Boolean).join(' ').trim();
  const handle = data?.Username?.trim() ? `@${data.Username.trim().replace(/^@+/, '')}` : '';
  const title = full.length > 0 ? full : handle || 'Acts member';
  const subtitle = full.length > 0 ? handle : '';

  return (
    <View className="mb-3 flex-row items-center justify-between rounded-2xl border border-acts-border/70 bg-acts-surface px-4 py-3">
      <View className="min-w-0 flex-1 pr-2">
        <AppText variant="subtitle" className="text-acts-ink" numberOfLines={1}>
          {title}
        </AppText>
        {subtitle ? (
          <AppText variant="caption" className="text-acts-muted" numberOfLines={1}>
            {subtitle}
          </AppText>
        ) : null}
      </View>
      <AppButton
        title="Unblock"
        variant="secondary"
        className="shrink-0"
        loading={unblock.isPending}
        disabled={unblock.isPending}
        accessibilityLabel={`Unblock ${title}`}
        onPress={() =>
          unblock.mutate(blockedUid, {
            onError: (e) => Alert.alert('Could not unblock', e instanceof Error ? e.message : 'Try again later.'),
          })
        }
      />
    </View>
  );
}

export default function SettingsPrivacyScreen() {
  const uid = useAuthStore((s) => s.user?.uid);
  const user = useAuthStore((s) => s.user);
  const { data: userInfo } = useUserInfoQuery(uid);
  const mutation = useMergeActsSettingsMutation(uid);
  const base = mergeActsDefaults(userInfo?.ActsSettings);
  const [pwBusy, setPwBusy] = useState(false);
  const blockedUids = useMemo(() => {
    const raw = userInfo?.BlockedUids;
    if (!Array.isArray(raw)) {
      return [];
    }
    return [...new Set(raw.filter((x): x is string => typeof x === 'string' && x.trim().length > 0).map((x) => x.trim()))];
  }, [userInfo?.BlockedUids]);

  const patch = (p: Partial<ActsAppSettings>) => {
    void mutation.mutateAsync(p);
  };

  const hasPasswordProvider = Boolean(user?.providerData?.some((p) => p.providerId === 'password'));
  const authLabel = user?.providerData?.map((p) => p.providerId).join(', ') || '-';

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

        <TitleWithInfo
          title="Profile Visibility"
          variant="title"
          className="mb-2"
          infoText="Your bio (Account settings) is always public to every signed-in Acts member, including people who are not your friends. The options below do not change bio visibility."
        />

        <FriendsOrMeRow
          label="Deed Feed"
          value={base.deedFeedVisibility}
          onPick={(v) => patch({ deedFeedVisibility: v })}
          disabled={mutation.isPending}
          infoText="New accounts default to friends-only on the deed feed. You can widen this anytime."
        />
        <FriendsOrMeRow
          label="Task History"
          value={base.taskHistoryVisibility}
          onPick={(v) => patch({ taskHistoryVisibility: v })}
          disabled={mutation.isPending}
        />
        <ThreeChoiceRow
          label="Service rank"
          value={base.profileServiceRankVisibility}
          options={PROFILE_STAT_VISIBILITY_OPTIONS}
          onPick={(v) => patch({ profileServiceRankVisibility: v as ProfileStatVisibility })}
          disabled={mutation.isPending}
        />
        <ThreeChoiceRow
          label="Streak"
          value={base.profileStreakVisibility}
          options={PROFILE_STAT_VISIBILITY_OPTIONS}
          onPick={(v) => patch({ profileStreakVisibility: v as ProfileStatVisibility })}
          disabled={mutation.isPending}
        />
        <ThreeChoiceRow
          label="Lifetime XP"
          value={base.profileXpVisibility}
          options={PROFILE_STAT_VISIBILITY_OPTIONS}
          onPick={(v) => patch({ profileXpVisibility: v as ProfileStatVisibility })}
          disabled={mutation.isPending}
        />
        <ThreeChoiceRow
          label="Acts completed"
          value={base.profileActsCompletedVisibility}
          options={PROFILE_STAT_VISIBILITY_OPTIONS}
          onPick={(v) => patch({ profileActsCompletedVisibility: v as ProfileStatVisibility })}
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
          label="React on deed posts"
          value={base.reactionsEnabled}
          onPick={(v) => patch({ reactionsEnabled: v })}
          disabled={mutation.isPending}
          infoText="Turning this off hides your react buttons; everyone can still see cheers on posts."
          showDivider={false}
        />

        <TitleWithInfo
          title="Blocked accounts"
          variant="title"
          className="mb-4 mt-8"
          infoText="Blocking also ends any friendship or pending request with that person. Their deed posts stay out of your feed until you unblock them."
        />
        {uid && blockedUids.length === 0 ? (
          <AppCard className="mb-2 p-4">
            <AppText variant="body" className="text-acts-muted">
              No blocked accounts.
            </AppText>
          </AppCard>
        ) : null}
        {uid && blockedUids.length > 0 ? (
          <View className="mb-2">
            {blockedUids.map((id) => (
              <BlockedAccountRow key={id} viewerUid={uid} blockedUid={id} />
            ))}
          </View>
        ) : null}
      </View>
    </Screen>
  );
}
