import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, View } from 'react-native';
import { Stack, useFocusEffect } from 'expo-router';

import {
  getLeaderboardLastSeenRank,
  getLeaderboardPreviousWeekSnapshot,
  setLeaderboardLastSeenRank,
} from '@/features/leaderboards/leaderboardLocalState';
import { shareLeaderboardRank } from '@/features/leaderboards/leaderboardShare';
import {
  rankDeltaSinceLastSeen,
  rankDeltaSinceWeekSnapshot,
} from '@/features/leaderboards/syncLeaderboardNotifications';
import { AppButton, AppCard, AppText, Badge, EmptyState, ListItem, Screen } from '@/shared/components/ui';
import { HeaderBackLabel } from '@/shared/components/HeaderBackLabel';
import { stackHeaderChrome } from '@/shared/navigation/stackHeaderChrome';
import { useActAppearance } from '@/shared/providers/ActAppearanceProvider';
import { useAuthStore } from '@/shared/stores/authStore';
import { useFriendsLeaderboardQuery } from '@/features/leaderboards/hooks/useLeaderboardQueries';
import type { LeaderboardEntry } from '@/features/leaderboards/leaderboardRepository';
import { borderRadius, spacing } from '@/shared/theme/designSystem';

function rankLabel(rank: number): string {
  switch (rank) {
    case 1:
      return '🥇';
    case 2:
      return '🥈';
    case 3:
      return '🥉';
    default:
      return `#${rank}`;
  }
}

function LeaderboardRow({
  entry,
  isCurrentUser,
  act,
}: {
  entry: LeaderboardEntry;
  isCurrentUser: boolean;
  act: ReturnType<typeof useActAppearance>;
}) {
  const badge = rankLabel(entry.rank);
  const isMedal = entry.rank <= 3;

  return (
    <ListItem
      title={entry.displayName}
      subtitle={`${entry.lifetimeXp.toLocaleString()} XP`}
      leftElement={
        <View
          style={{
            width: 44,
            height: 44,
            borderRadius: borderRadius.full,
            backgroundColor: isCurrentUser ? `${act.palette.green}22` : `${act.palette.blue}15`,
            alignItems: 'center',
            justifyContent: 'center',
          }}>
          <AppText style={{ fontSize: isMedal ? 22 : 15, fontWeight: '700', color: act.palette.ink }}>
            {badge}
          </AppText>
        </View>
      }
      rightElement={isCurrentUser ? <Badge label="You" variant="success" size="sm" /> : undefined}
      variant={isCurrentUser ? 'default' : 'subtle'}
    />
  );
}

export default function LeaderboardsScreen() {
  const act = useActAppearance();
  const userId = useAuthStore((s) => s.user?.uid);
  const { data, isLoading, isError } = useFriendsLeaderboardQuery(userId);
  const [lastSeenRank, setLastSeenRank] = useState<number | null>(null);
  const [weekSnapshot, setWeekSnapshot] = useState<Awaited<ReturnType<typeof getLeaderboardPreviousWeekSnapshot>>>(null);
  const [sharing, setSharing] = useState(false);

  const entries = data?.entries ?? [];
  const userRank = data?.userRank;

  useFocusEffect(
    useCallback(() => {
      if (!userId) {
        return;
      }
      let active = true;
      void Promise.all([getLeaderboardLastSeenRank(userId), getLeaderboardPreviousWeekSnapshot(userId)]).then(
        ([seen, snapshot]) => {
          if (active) {
            setLastSeenRank(seen);
            setWeekSnapshot(snapshot);
          }
        },
      );
      return () => {
        active = false;
        if (userRank) {
          void setLeaderboardLastSeenRank(userId, userRank.rank);
        }
      };
    }, [userId, userRank?.rank]),
  );

  useEffect(() => {
    if (userId && userRank) {
      void setLeaderboardLastSeenRank(userId, userRank.rank);
    }
  }, [userId, userRank?.rank]);

  const visitDelta = userRank ? rankDeltaSinceLastSeen(lastSeenRank, userRank.rank) : null;
  const weekDelta = userRank ? rankDeltaSinceWeekSnapshot(weekSnapshot, userRank.rank) : null;

  const onShare = () => {
    if (!userRank) {
      return;
    }
    setSharing(true);
    void shareLeaderboardRank(userRank, entries.length, userId).finally(() => setSharing(false));
  };

  const headerOptions = {
    ...stackHeaderChrome(act),
    headerShown: true as const,
    title: 'Friends Leaderboard',
    headerTitleStyle: { color: act.palette.ink, fontWeight: '800' as const },
    headerLeft: () => <HeaderBackLabel />,
  };

  if (isLoading) {
    return (
      <>
        <Stack.Screen options={headerOptions} />
        <Screen>
          <View className="flex-1 items-center justify-center py-24">
            <ActivityIndicator size="large" color={act.palette.green} />
          </View>
        </Screen>
      </>
    );
  }

  if (isError) {
    return (
      <>
        <Stack.Screen options={headerOptions} />
        <Screen>
          <EmptyState
            icon="⚠️"
            title="Couldn't load rankings"
            description="Check your connection and pull to try again."
          />
        </Screen>
      </>
    );
  }

  if (entries.length <= 1) {
    return (
      <>
        <Stack.Screen options={headerOptions} />
        <Screen>
          <EmptyState
            icon="🏆"
            title="Add friends to compete"
            description="Once you add friends, you'll see how your kindness XP stacks up against theirs."
          />
        </Screen>
      </>
    );
  }

  return (
    <>
      <Stack.Screen options={headerOptions} />
      <View className="flex-1 bg-acts-canvas">
        {userRank ? (
          <View className="px-5 pb-3 pt-3">
            <AppText variant="bodySmall" className="text-acts-muted">
              Your position
            </AppText>
            <View className="mt-2">
              <Badge
                label={`${rankLabel(userRank.rank)} of ${entries.length} • ${userRank.lifetimeXp.toLocaleString()} XP`}
                variant="info"
                size="md"
              />
            </View>
            {visitDelta != null && visitDelta > 0 ? (
              <AppCard className="mt-3 border-acts-green/40 bg-acts-green-soft/80 p-3">
                <AppText variant="subtitle" className="text-acts-ink">
                  You moved up {visitDelta} {visitDelta === 1 ? 'spot' : 'spots'}!
                </AppText>
                <AppText variant="caption" className="mt-1 text-acts-muted">
                  You&apos;re now #{userRank.rank} among friends since your last visit.
                </AppText>
              </AppCard>
            ) : null}
            {weekDelta != null && weekDelta > 0 && visitDelta !== weekDelta ? (
              <AppCard className="mt-3 border-acts-green/30 bg-acts-surface p-3">
                <AppText variant="caption" className="text-acts-muted">
                  Up {weekDelta} {weekDelta === 1 ? 'spot' : 'spots'} since last week — keep the momentum going.
                </AppText>
              </AppCard>
            ) : null}
            <AppButton
              title="Share my rank"
              variant="secondary"
              className="mt-3 w-full"
              loading={sharing}
              disabled={sharing}
              onPress={onShare}
            />
          </View>
        ) : null}
        <FlatList
          data={entries}
          keyExtractor={(item) => item.userId}
          renderItem={({ item }) => (
            <View className="px-5 py-1">
              <LeaderboardRow entry={item} isCurrentUser={item.userId === userId} act={act} />
            </View>
          )}
          contentContainerStyle={{ paddingBottom: spacing.lg, paddingTop: spacing.xs }}
          showsVerticalScrollIndicator={false}
        />
      </View>
    </>
  );
}
