import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { userInfoQueryKeys } from '@/features/user-profile/queryKeys';
import { useUserInfoQuery } from '@/features/user-profile/hooks/useUserInfoQuery';

import type { SeasonalChallenge, SeasonalSeason } from '../data/seasons';
import {
  pickCelebrationMilestone,
  totalSeasonLogs,
  type SeasonMilestone,
} from '../seasonMilestones';
import { maybeFireSeasonMilestoneNotification } from '../seasonChallengeNotifications';
import {
  fetchSeasonProgress,
  recordChallengeCompletion,
  type ChallengeCompletionResult,
} from '../seasonalChallengeRepository';
import { mergeActsDefaults } from '@/shared/types/actsSettings';

export const seasonalChallengeQueryKeys = {
  all: ['seasonalChallenges'] as const,
  progress: (userId: string, seasonId: string) =>
    [...seasonalChallengeQueryKeys.all, 'progress', userId, seasonId] as const,
};

/** The signed-in user's progress for a given season. */
export function useSeasonProgressQuery(userId: string | undefined, seasonId: string | undefined) {
  return useQuery({
    queryKey: seasonalChallengeQueryKeys.progress(userId ?? '', seasonId ?? ''),
    queryFn: async () => {
      if (!userId || !seasonId) {
        return null;
      }
      return fetchSeasonProgress(userId, seasonId);
    },
    enabled: Boolean(userId && seasonId),
    staleTime: 1000 * 30,
  });
}

/** Records a challenge completion and refreshes progress + the user's XP. */
export function useRecordChallengeCompletionMutation(
  userId: string | undefined,
  options?: { onMilestone?: (milestone: SeasonMilestone | null) => void },
) {
  const queryClient = useQueryClient();
  const { data: userInfo } = useUserInfoQuery(userId);
  const settings = mergeActsDefaults(userInfo?.ActsSettings);

  return useMutation<
    ChallengeCompletionResult,
    Error,
    { season: SeasonalSeason; challenge: SeasonalChallenge; note?: string; photoLocalUri?: string }
  >({
    mutationFn: async ({ season, challenge, note, photoLocalUri }) => {
      if (!userId) {
        throw new Error('Not signed in');
      }
      const prev = await fetchSeasonProgress(userId, season.id);
      const result = await recordChallengeCompletion(userId, season, challenge, note, photoLocalUri);
      const prevLogs = totalSeasonLogs(prev.completions);
      const nextLogs = totalSeasonLogs({
        ...prev.completions,
        [challenge.id]: result.newCount,
      });
      const milestone = pickCelebrationMilestone(
        prev.totalXpEarned,
        result.totalXpEarned,
        prevLogs,
        nextLogs,
      );
      if (milestone && settings.notifySeasonChallenges !== false) {
        void maybeFireSeasonMilestoneNotification(userId, season, milestone);
      }
      options?.onMilestone?.(milestone);
      return result;
    },
    onSuccess: (_result, { season }) => {
      if (!userId) {
        return;
      }
      void queryClient.invalidateQueries({
        queryKey: seasonalChallengeQueryKeys.progress(userId, season.id),
      });
      void queryClient.invalidateQueries({ queryKey: userInfoQueryKeys.detail(userId) });
    },
  });
}
