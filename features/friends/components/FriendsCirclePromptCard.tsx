import Ionicons from '@expo/vector-icons/Ionicons';
import { router, type Href } from 'expo-router';
import { useCallback } from 'react';
import { Share, View } from 'react-native';

import { INVITE_FRIEND_REWARD } from '@/features/friends/inviteRewardConfig';
import { AppButton, AppCard, AppText } from '@/shared/components/ui';
import { getInviteShareMessage } from '@/shared/config/appInvite';
import { useActAppearance } from '@/shared/providers/ActAppearanceProvider';
import { useAuthStore } from '@/shared/stores/authStore';

export type FriendsCirclePromptVariant = 'feed_no_friends' | 'feed_no_posts' | 'tasks_grow';

type FriendsCirclePromptCardProps = {
  variant: FriendsCirclePromptVariant;
  /** Accepted friend count (not including self). */
  friendCount: number;
  className?: string;
};

/** True when we should nudge the user to grow their friend circle (0–1 friends). */
export function shouldShowFriendsCirclePrompt(friendCount: number): boolean {
  return friendCount <= 1;
}

function titleForVariant(variant: FriendsCirclePromptVariant, friendCount: number): string {
  if (variant === 'feed_no_posts') {
    return 'No friend deeds yet';
  }
  if (friendCount === 0) {
    return variant === 'tasks_grow' ? 'Acts is better with friends' : 'Your feed starts with friends';
  }
  return 'Add one more friend';
}

function bodyForVariant(variant: FriendsCirclePromptVariant, friendCount: number): string {
  if (variant === 'feed_no_posts') {
    return 'When friends complete an act and share a photo, it shows up here. Invite someone or share your own deed to get things moving.';
  }
  if (friendCount === 0) {
    return 'Invite people you know. When they join from your link and you connect, you both earn bonus seeds and your deed feed comes alive.';
  }
  return 'One friend is a great start. Invite another person you trust so your feed stays active and you can cheer each other on.';
}

export function FriendsCirclePromptCard({
  variant,
  friendCount,
  className = '',
}: FriendsCirclePromptCardProps) {
  const act = useActAppearance();
  const uid = useAuthStore((s) => s.user?.uid);

  const onShareInvite = useCallback(() => {
    void Share.share({
      message: getInviteShareMessage(uid),
      title: 'Acts',
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

      <AppButton
        title="Share invite link"
        className="mb-2 w-full"
        accessibilityLabel="Share Acts invite link"
        onPress={onShareInvite}
      />
      <AppButton
        title="Find friends"
        variant="secondary"
        className="mb-2 w-full"
        accessibilityLabel="Open friends screen to add people"
        onPress={onFindFriends}
      />
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
      ) : (
        <AppButton
          title="Share your own deed"
          variant="secondary"
          className="w-full"
          accessibilityLabel="Go to tasks to share a deed"
          onPress={onGoToTasks}
        />
      )}
    </AppCard>
  );
}
