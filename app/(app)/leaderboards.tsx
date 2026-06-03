import { ActivityIndicator, FlatList, View } from 'react-native';
import { Stack } from 'expo-router';

import { AppText, Badge, EmptyState, ListItem, Screen } from '@/shared/components/ui';
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

  const entries = data?.entries ?? [];
  const userRank = data?.userRank;

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

  // Only the signed-in user (no friends yet, or friends have no XP edge cases still show the user).
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
