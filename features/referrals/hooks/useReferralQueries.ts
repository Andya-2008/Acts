import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getReferralCode,
  getReferralStats,
  getReferralHistory,
  getPendingReferralRewards,
  processReferralSignup,
  trackReferralProgress,
  type ReferralCode,
  type ReferralSignup,
  type ReferralReward,
} from '../referralRepository';

// Query keys
export const referralQueryKeys = {
  all: ['referrals'] as const,
  byUser: (userId: string) => [...referralQueryKeys.all, 'user', userId] as const,
  code: (userId: string) => [...referralQueryKeys.byUser(userId), 'code'] as const,
  stats: (userId: string) => [...referralQueryKeys.byUser(userId), 'stats'] as const,
  history: (userId: string) => [...referralQueryKeys.byUser(userId), 'history'] as const,
  rewards: (userId: string) => [...referralQueryKeys.byUser(userId), 'rewards'] as const,
};

/**
 * Hook to get user's referral code
 */
export function useReferralCodeQuery(userId: string | undefined, displayName: string | undefined) {
  return useQuery({
    queryKey: referralQueryKeys.code(userId || ''),
    queryFn: async () => {
      if (!userId || !displayName) return null;
      return getReferralCode(userId, displayName);
    },
    enabled: !!userId && !!displayName,
    staleTime: 1000 * 60 * 60, // 1 hour
  });
}

/**
 * Hook to get referral stats
 */
export function useReferralStatsQuery(userId: string | undefined) {
  return useQuery({
    queryKey: referralQueryKeys.stats(userId || ''),
    queryFn: async () => {
      if (!userId) return null;
      return getReferralStats(userId);
    },
    enabled: !!userId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

/**
 * Hook to get referral history (who user referred)
 */
export function useReferralHistoryQuery(userId: string | undefined) {
  return useQuery({
    queryKey: referralQueryKeys.history(userId || ''),
    queryFn: async () => {
      if (!userId) return [];
      return getReferralHistory(userId);
    },
    enabled: !!userId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

/**
 * Hook to get pending rewards
 */
export function usePendingRewardsQuery(userId: string | undefined) {
  return useQuery({
    queryKey: referralQueryKeys.rewards(userId || ''),
    queryFn: async () => {
      if (!userId) return [];
      return getPendingReferralRewards(userId);
    },
    enabled: !!userId,
    staleTime: 1000 * 60, // 1 minute
  });
}

/**
 * Hook to process referral signup
 */
export function useProcessReferralSignupMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      newUserId: string;
      referralCode: string;
      displayName: string;
    }) => {
      return processReferralSignup(params.newUserId, params.referralCode, params.displayName);
    },
    onSuccess: (data) => {
      if (data.referrerId) {
        // Invalidate referrer's queries
        queryClient.invalidateQueries({
          queryKey: referralQueryKeys.byUser(data.referrerId),
        });
      }
    },
  });
}

/**
 * Hook to track task completion for referral progress
 */
export function useTrackReferralProgressMutation(userId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!userId) throw new Error('User ID required');
      return trackReferralProgress(userId);
    },
    onSuccess: () => {
      if (userId) {
        queryClient.invalidateQueries({
          queryKey: referralQueryKeys.byUser(userId),
        });
      }
    },
  });
}
