import { useQuery } from '@tanstack/react-query';

import { getFriendsLeaderboard } from '../leaderboardRepository';

export const leaderboardQueryKeys = {
  all: ['leaderboards'] as const,
  friends: (userId: string) => [...leaderboardQueryKeys.all, 'friends', userId] as const,
};

/** Ranks the signed-in user against their accepted friends by lifetime XP. */
export function useFriendsLeaderboardQuery(userId: string | undefined) {
  return useQuery({
    queryKey: leaderboardQueryKeys.friends(userId ?? ''),
    queryFn: async () => {
      if (!userId) {
        return { entries: [], userRank: undefined };
      }
      return getFriendsLeaderboard(userId);
    },
    enabled: Boolean(userId),
    staleTime: 1000 * 60 * 5,
  });
}
