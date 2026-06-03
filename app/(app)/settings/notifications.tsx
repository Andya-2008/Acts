import { View } from 'react-native';

import { ThreeChoiceRow, YesNoRow } from '@/features/settings/components/SettingsRows';
import { useMergeActsSettingsMutation } from '@/features/user-profile/hooks/useUserInfoMutations';
import { useUserInfoQuery } from '@/features/user-profile/hooks/useUserInfoQuery';
import { mergeActsDefaults } from '@/shared/types/actsSettings';
import { Screen, TitleWithInfo } from '@/shared/components/ui';
import { useAuthStore } from '@/shared/stores/authStore';

const REMINDER_HOUR_OPTIONS = [
  { key: '9', label: '9:00 AM' },
  { key: '12', label: '12:00 PM' },
  { key: '15', label: '3:00 PM' },
  { key: '18', label: '6:00 PM' },
  { key: '21', label: '9:00 PM' },
];

const NOTIFICATIONS_INTRO =
  'Reminders run on this device. Allow notifications when prompted. Tapping a reminder opens Tasks.';

const INCOMPLETE_NUDGE_INFO =
  'Incomplete nudges fire three hours after your daily time (by 9 PM).';

const FRIENDS_PUSH_INFO =
  'Choose what you want to hear about. These show up in your Activity feed, and as alerts on this device while Acts is open.';

export default function SettingsNotificationsScreen() {
  const uid = useAuthStore((s) => s.user?.uid);
  const { data: userInfo } = useUserInfoQuery(uid);
  const mutation = useMergeActsSettingsMutation(uid);
  const base = mergeActsDefaults(userInfo?.ActsSettings);

  const dailySchedulingOn = base.notifyDailyReminder || base.notifyIncompleteActWarning;
  const hourKey = String(
    REMINDER_HOUR_OPTIONS.some((o) => o.key === String(base.retentionDailyReminderHour))
      ? base.retentionDailyReminderHour
      : 18,
  );

  const pick = (patch: Parameters<typeof mutation.mutateAsync>[0]) => {
    void mutation.mutateAsync(patch);
  };

  return (
    <Screen scroll>
      <View className="pb-8">
        <TitleWithInfo title="Notifications" showTitle={false} infoText={NOTIFICATIONS_INTRO} />

        <TitleWithInfo title="Daily & streak" variant="subtitle" className="mb-2" />
        <YesNoRow
          label="Daily reminder"
          value={base.notifyDailyReminder}
          onPick={(v) => pick({ notifyDailyReminder: v })}
          disabled={mutation.isPending}
        />
        <YesNoRow
          label="Incomplete acts nudge"
          value={base.notifyIncompleteActWarning}
          onPick={(v) => pick({ notifyIncompleteActWarning: v })}
          disabled={mutation.isPending}
          infoText={INCOMPLETE_NUDGE_INFO}
        />
        <YesNoRow
          label="Streak evening nudge (8 PM)"
          value={base.notifyStreakWarning}
          onPick={(v) => pick({ notifyStreakWarning: v })}
          disabled={mutation.isPending}
          showDivider={!dailySchedulingOn}
        />
        {dailySchedulingOn ? (
          <ThreeChoiceRow
            label="Daily reminder time"
            value={hourKey}
            options={REMINDER_HOUR_OPTIONS}
            onPick={(k) => pick({ retentionDailyReminderHour: Number(k) })}
            disabled={mutation.isPending}
          />
        ) : null}

        <TitleWithInfo title="Weekly & monthly" variant="subtitle" className="mb-2 mt-4" />
        <YesNoRow
          label="Sunday recap (6 PM)"
          value={base.notifyWeeklyRecap}
          onPick={(v) => pick({ notifyWeeklyRecap: v })}
          disabled={mutation.isPending}
        />
        <YesNoRow
          label="Monday weekly acts (9 AM)"
          value={base.notifyWeeklyActReminder}
          onPick={(v) => pick({ notifyWeeklyActReminder: v })}
          disabled={mutation.isPending}
        />
        <YesNoRow
          label="Monthly act (1st of month, 10 AM)"
          value={base.notifyMonthlyActReminder}
          onPick={(v) => pick({ notifyMonthlyActReminder: v })}
          disabled={mutation.isPending}
        />
        <YesNoRow
          label="Weekend double rewards (Friday 10 AM)"
          value={base.notifyWeekendDoublePromo}
          onPick={(v) => pick({ notifyWeekendDoublePromo: v })}
          disabled={mutation.isPending}
        />

        <TitleWithInfo
          title="Friend activity"
          variant="subtitle"
          className="mb-2 mt-6"
          infoText={FRIENDS_PUSH_INFO}
        />
        <YesNoRow
          label="Friend posts on the feed"
          value={base.notifyFriendsPosting}
          onPick={(v) => pick({ notifyFriendsPosting: v })}
          disabled={mutation.isPending}
        />
        <YesNoRow
          label="Reactions on your posts"
          value={base.notifyFriendsReactions}
          onPick={(v) => pick({ notifyFriendsReactions: v })}
          disabled={mutation.isPending}
        />
        <YesNoRow
          label="Friend requests"
          value={base.notifyFriendRequests}
          onPick={(v) => pick({ notifyFriendRequests: v })}
          disabled={mutation.isPending}
        />
        <YesNoRow
          label="Friend request accepted"
          value={base.notifyFriendRequestAccepted}
          onPick={(v) => pick({ notifyFriendRequestAccepted: v })}
          disabled={mutation.isPending}
        />
        <YesNoRow
          label="New suggested acts in catalog"
          value={base.notifyNewActs}
          onPick={(v) => pick({ notifyNewActs: v })}
          disabled={mutation.isPending}
          showDivider={false}
        />
      </View>
    </Screen>
  );
}
