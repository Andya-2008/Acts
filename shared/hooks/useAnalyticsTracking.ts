import { useCallback } from 'react';
import {
  trackTaskCompleted,
  trackDeedPosted,
  trackDeedEngagement,
  trackFriendAction,
  trackShopPurchase,
  trackAchievementUnlocked,
  trackSettingsChange,
  trackScreenView,
  trackErrorEvent,
  trackAccountDeleted,
  trackReferralConversion,
  trackChallengeParticipation,
  trackChallengeCompleted,
} from '@/shared/services/firebase/analytics';

/**
 * Hook for tracking analytics events throughout the app
 * Use this instead of importing individual track* functions
 * 
 * Example:
 * ```tsx
 * const { trackTask, trackFeed } = useAnalyticsTracking();
 * 
 * // When user completes a task
 * trackTask.completed(taskId, difficulty, xpGained);
 * ```
 */
export function useAnalyticsTracking() {
  const trackTask = {
    completed: useCallback(
      (taskId: string, difficulty: number, xpEarned: number) => {
        trackTaskCompleted(taskId, difficulty, xpEarned);
      },
      [],
    ),
  };

  const trackDeed = {
    posted: useCallback(
      (hasPhoto: boolean, hasCaption: boolean) => {
        trackDeedPosted(hasPhoto, hasCaption);
      },
      [],
    ),
    engaged: useCallback(
      (action: 'view' | 'react' | 'comment', postId: string) => {
        trackDeedEngagement(action, postId);
      },
      [],
    ),
  };

  const trackFriend = {
    actionPerformed: useCallback(
      (action: 'add' | 'remove' | 'invite') => {
        trackFriendAction(action);
      },
      [],
    ),
  };

  const trackShop = {
    purchased: useCallback(
      (itemId: string, seedsCost: number, itemKind: string) => {
        trackShopPurchase(itemId, seedsCost, itemKind);
      },
      [],
    ),
  };

  const trackAchievement = {
    unlocked: useCallback(
      (achievementId: string) => {
        trackAchievementUnlocked(achievementId);
      },
      [],
    ),
  };

  const trackSettings = {
    changed: useCallback(
      (setting: string, value: string | boolean) => {
        trackSettingsChange(setting, value);
      },
      [],
    ),
  };

  const trackUI = {
    screenViewed: useCallback(
      (screenName: string) => {
        trackScreenView(screenName);
      },
      [],
    ),
  };

  const trackError = {
    occurred: useCallback(
      (errorType: string, errorMessage: string, severity: 'low' | 'medium' | 'high' = 'medium') => {
        trackErrorEvent(errorType, errorMessage, severity);
      },
      [],
    ),
  };

  const trackAccount = {
    deleted: useCallback(() => {
      trackAccountDeleted();
    }, []),
  };

  const trackReferral = {
    converted: useCallback(
      (referrerUid: string) => {
        trackReferralConversion(referrerUid);
      },
      [],
    ),
  };

  const trackChallenge = {
    participated: useCallback(
      (challengeId: string) => {
        trackChallengeParticipation(challengeId);
      },
      [],
    ),
    completed: useCallback(
      (challengeId: string, xpEarned: number) => {
        trackChallengeCompleted(challengeId, xpEarned);
      },
      [],
    ),
  };

  return {
    trackTask,
    trackDeed,
    trackFriend,
    trackShop,
    trackAchievement,
    trackSettings,
    trackUI,
    trackError,
    trackAccount,
    trackReferral,
    trackChallenge,
  };
}

export type AnalyticsTracking = ReturnType<typeof useAnalyticsTracking>;
