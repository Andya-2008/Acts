import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { userInfoQueryKeys } from '@/features/user-profile/queryKeys';

import type { SeasonalChallenge, SeasonalSeason } from '../data/seasons';
import {
  fetchSeasonProgress,
  recordChallengeCompletion,
  type ChallengeCompletionResult,
} from '../seasonalChallengeRepository';

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
export function useRecordChallengeCompletionMutation(userId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation<
    ChallengeCompletionResult,
    Error,
    { season: SeasonalSeason; challenge: SeasonalChallenge; note?: string; photoLocalUri?: string }
  >({
    mutationFn: async ({ season, challenge, note, photoLocalUri }) => {
      if (!userId) {
        throw new Error('Not signed in');
      }
      return recordChallengeCompletion(userId, season, challenge, note, photoLocalUri);
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
