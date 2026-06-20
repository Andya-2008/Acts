import Ionicons from '@expo/vector-icons/Ionicons';
import { router, type Href } from 'expo-router';
import { useCallback, useState } from 'react';
import { View } from 'react-native';

import { INVITE_FRIEND_REWARD } from '@/features/friends/inviteRewardConfig';
import { shouldShowFriendsCirclePrompt } from '@/features/friends/friendsCircleConfig';
import { AddPhoneForContactsHint } from '@/features/friends/components/AddPhoneForContactsHint';
import { copyInviteLink, shareInviteLink } from '@/features/sharing/inviteShareActions';
import { AppButton, AppCard, AppText } from '@/shared/components/ui';
import { useActAppearance } from '@/shared/providers/ActAppearanceProvider';
import { useAuthStore } from '@/shared/stores/authStore';

export type FriendsCirclePromptVariant =
  | 'feed_no_friends'
  | 'feed_no_posts'
  | 'tasks_grow'
  | 'friends_hub';

type FriendsCirclePromptCardProps = {
  variant: FriendsCirclePromptVariant;
  /** Accepted friend count (not including self). */
  friendCount: number;
  /** When true, nudge adding a profile phone for contact matching. */
  showPhoneHint?: boolean;
  className?: string;
};

export { shouldShowFriendsCirclePrompt };

function titleForVariant(variant: FriendsCirclePromptVariant, friendCount: number): string {
  if (variant === 'feed_no_posts') {
    return 'No friend deeds yet';
  }
  if (friendCount === 0) {
    if (variant === 'tasks_grow') {
      return 'Nice first act — add a friend';
    }
    return variant === 'friends_hub' ? 'Grow your friend circle' : 'Your feed starts with friends';
  }
  if (friendCount === 1) {
    return 'Add one more friend';
  }
  return 'Grow your circle';
}

function bodyForVariant(variant: FriendsCirclePromptVariant, friendCount: number): string {
  if (variant === 'feed_no_posts') {
    return 'When friends complete an act and share a photo, it shows up here. Invite someone or share your own deed to get things moving.';
  }
  if (variant === 'tasks_grow' && friendCount === 0) {
    return 'Acts shines when people you trust are here too. Share your invite link or add someone from contacts so your deed feed and streaks feel shared.';
  }
  if (friendCount === 0) {
    return 'Invite people you know. When they join from your link and you connect, you both earn bonus seeds and your deed feed comes alive.';
  }
  if (friendCount === 1) {
    return 'One friend is a great start. Invite another person you trust so your feed stays active and you can cheer each other on.';
  }
  return 'A small circle keeps Acts lively. Invite someone else or add a contact match so you have more deeds to celebrate together.';
}

export function FriendsCirclePromptCard({
  variant,
  friendCount,
  showPhoneHint = false,
  className = '',
}: FriendsCirclePromptCardProps) {
  const act = useActAppearance();
  const uid = useAuthStore((s) => s.user?.uid);
  const [copied, setCopied] = useState(false);

  const onShareInvite = useCallback(() => {
    void shareInviteLink(uid, 'Acts');
  }, [uid]);

  const onCopyInvite = useCallback(() => {
    void copyInviteLink(uid).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [uid]);

  const onFindFriends = useCallback(() => {
    router.push('/(app)/(tabs)/deed-feed/friends' as Href);
  }, []);

  const onGoToTasks = useCallback(() => {
    router.push('/(app)/(tabs)/tasks' as Href);
  }, []);

  const onOpenFeed = useCallback(() => {
    router.push('/(app)/(tabs)/deed-feed' as Href);
  }, []);

  const compact = variant === 'tasks_grow';

  return (
    <AppCard
      className={`border-acts-green/35 bg-acts-green-soft/50 ${compact ? 'p-4' : 'p-5'} ${className}`}>
      <View className="mb-3 flex-row items-start">
        <View
          className="mr-3 h-12 w-12 shrink-0 items-center justify-center rounded-2xl"
          style={{ backgroundColor: `${act.palette.green}22` }}>
          <Ionicons name="people" size={26} color={act.palette.green} />
        </View>
        <View className="min-w-0 flex-1">
          <AppText variant="subtitle" className="mb-1 text-acts-ink">
            {titleForVariant(variant, friendCount)}
          </AppText>
          <AppText variant="caption" className="leading-5 text-acts-muted">
            {bodyForVariant(variant, friendCount)}
          </AppText>
        </View>
      </View>

      <View
        className="mb-4 flex-row items-center self-start rounded-full px-3 py-1.5"
        style={{ backgroundColor: act.palette.surface }}>
        <Ionicons name="gift-outline" size={14} color={act.palette.green} />
        <AppText variant="caption" className="ml-1.5 font-semibold text-acts-green">
          +{INVITE_FRIEND_REWARD.inviterSeeds} seeds · +{INVITE_FRIEND_REWARD.inviterXp} XP per friend
        </AppText>
      </View>

      <View className="mb-4 flex-row gap-2">
        <AppButton
          title="Share invite link"
          className="flex-1"
          accessibilityLabel="Share Acts invite link"
          onPress={onShareInvite}
        />
        <AppButton
          title={copied ? 'Copied!' : 'Copy link'}
          variant="secondary"
          className="flex-1"
          accessibilityLabel="Copy Acts invite link"
          onPress={onCopyInvite}
        />
      </View>
      {variant !== 'friends_hub' ? (
        <AppButton
          title="Find friends"
          variant="secondary"
          className="mb-2 w-full"
          accessibilityLabel="Open friends screen to add people"
          onPress={onFindFriends}
        />
      ) : null}
      {variant === 'feed_no_friends' || variant === 'tasks_grow' ? (
        <AppButton
          title={variant === 'tasks_grow' ? 'Open deed feed' : 'Complete an act first'}
          variant="secondary"
          className="w-full"
          accessibilityLabel={
            variant === 'tasks_grow' ? 'Open deed feed tab' : 'Go to tasks to complete an act'
          }
          onPress={variant === 'tasks_grow' ? onOpenFeed : onGoToTasks}
        />
      ) : variant === 'feed_no_posts' ? (
        <AppButton
          title="Share your own deed"
          variant="secondary"
          className="w-full"
          accessibilityLabel="Go to tasks to share a deed"
          onPress={onGoToTasks}
        />
      ) : null}
      {showPhoneHint ? <AddPhoneForContactsHint className="mt-3" /> : null}
    </AppCard>
  );
}
