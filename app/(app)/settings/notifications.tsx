import { View } from 'react-native';

import { YesNoRow } from '@/features/settings/components/SettingsRows';
import { useMergeActsSettingsMutation } from '@/features/user-profile/hooks/useUserInfoMutations';
import { useUserInfoQuery } from '@/features/user-profile/hooks/useUserInfoQuery';
import { mergeActsDefaults } from '@/shared/types/actsSettings';
import { Screen } from '@/shared/components/ui';
import { useAuthStore } from '@/shared/stores/authStore';

export default function SettingsNotificationsScreen() {
  const uid = useAuthStore((s) => s.user?.uid);
  const { data: userInfo } = useUserInfoQuery(uid);
  const mutation = useMergeActsSettingsMutation(uid);
  const base = mergeActsDefaults(userInfo?.ActsSettings);

  return (
    <Screen scroll>
      <View className="pb-8">
        <YesNoRow
          label="Friends Posting"
          value={base.notifyFriendsPosting}
          onPick={(v) => void mutation.mutateAsync({ notifyFriendsPosting: v })}
          disabled={mutation.isPending}
        />
        <YesNoRow
          label="Streak Warning"
          value={base.notifyStreakWarning}
          onPick={(v) => void mutation.mutateAsync({ notifyStreakWarning: v })}
          disabled={mutation.isPending}
        />
        <YesNoRow
          label="Friends Reactions"
          value={base.notifyFriendsReactions}
          onPick={(v) => void mutation.mutateAsync({ notifyFriendsReactions: v })}
          disabled={mutation.isPending}
        />
        <YesNoRow
          label="Friend Requests"
          value={base.notifyFriendRequests}
          onPick={(v) => void mutation.mutateAsync({ notifyFriendRequests: v })}
          disabled={mutation.isPending}
        />
        <YesNoRow
          label="Friend Request Accepted"
          value={base.notifyFriendRequestAccepted}
          onPick={(v) => void mutation.mutateAsync({ notifyFriendRequestAccepted: v })}
          disabled={mutation.isPending}
        />
        <YesNoRow
          label="New Acts"
          value={base.notifyNewActs}
          onPick={(v) => void mutation.mutateAsync({ notifyNewActs: v })}
          disabled={mutation.isPending}
        />
        <YesNoRow
          label="Incomplete Act Warning"
          value={base.notifyIncompleteActWarning}
          onPick={(v) => void mutation.mutateAsync({ notifyIncompleteActWarning: v })}
          disabled={mutation.isPending}
        />
      </View>
    </Screen>
  );
}
