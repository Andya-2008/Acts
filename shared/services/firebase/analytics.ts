import { getAnalytics, logEvent, setUserProperties } from 'firebase/analytics';
import { Platform } from 'react-native';
import { getFirebaseApp } from './client';

/**
 * Firebase Analytics service for Acts app
 * Tracks user behavior, engagement, and conversions
 *
 * Automatically initialized on first use.
 * All methods are no-ops on native (Analytics is web-only in this setup).
 */

let analyticsInstance: ReturnType<typeof getAnalytics> | null = null;

function getAnalyticsInstance() {
  if (!analyticsInstance && Platform.OS === 'web') {
    try {
      analyticsInstance = getAnalytics(getFirebaseApp());
    } catch {
      console.warn('[Analytics] Firebase Analytics not available on this platform');
    }
  }
  return analyticsInstance;
}

function trackEvent(eventName: string, params?: Record<string, string | number>) {
  const analytics = getAnalyticsInstance();
  if (!analytics) return;

  try {
    logEvent(analytics, eventName, params);
  } catch (error) {
    console.warn(`[Analytics] Failed to log ${eventName}:`, error);
  }
}

/** Set user properties (demographics, cohort, etc.) */
export function setAnalyticsUserProperties(properties: Record<string, string | number>) {
  const analytics = getAnalyticsInstance();
  if (!analytics) return;

  try {
    setUserProperties(analytics, properties);
  } catch (error) {
    console.warn('[Analytics] Failed to set user properties:', error);
  }
}

/** Track user sign-up */
export function trackSignUp(method: 'email' | 'google') {
  trackEvent('sign_up', { method });
}

/** Track user sign-in */
export function trackSignIn(method: 'email' | 'google') {
  trackEvent('login', { method });
}

/** Track task completion */
export function trackTaskCompleted(taskId: string, difficulty: number, xpEarned: number) {
  trackEvent('task_completed', {
    task_id: taskId,
    difficulty,
    xp_earned: xpEarned,
  });
}

/** Track deed post creation */
export function trackDeedPosted(hasPhoto: boolean, hasCaption: boolean) {
  trackEvent('deed_posted', {
    has_photo: hasPhoto ? 1 : 0,
    has_caption: hasCaption ? 1 : 0,
  });
}

/** Track deed feed engagement */
export function trackDeedEngagement(action: 'view' | 'react' | 'comment', postId: string) {
  trackEvent('deed_engagement', {
    action,
    post_id: postId,
  });
}

/** Track friend activity */
export function trackFriendAction(action: 'add' | 'remove' | 'invite') {
  trackEvent('friend_action', { action });
}

/** Track shop purchase */
export function trackShopPurchase(itemId: string, seedsCost: number, itemKind: string) {
  trackEvent('shop_purchase', {
    item_id: itemId,
    seeds_cost: seedsCost,
    item_kind: itemKind,
  });
}

/** Track achievement unlock */
export function trackAchievementUnlocked(achievementId: string) {
  trackEvent('achievement_unlocked', {
    achievement_id: achievementId,
  });
}

/** Track settings changes */
export function trackSettingsChange(setting: string, value: string | boolean) {
  trackEvent('settings_changed', {
    setting,
    value: String(value),
  });
}

/** Track screen views (for tracking user navigation) */
export function trackScreenView(screenName: string) {
  trackEvent('screen_view', {
    firebase_screen: screenName,
    firebase_screen_class: screenName,
  });
}

/** Track app crashes / errors (for debugging) */
export function trackErrorEvent(errorType: string, errorMessage: string, severity: 'low' | 'medium' | 'high') {
  trackEvent('app_error', {
    error_type: errorType,
    error_message: errorMessage,
    severity,
  });
}

/** Track account deletion */
export function trackAccountDeleted() {
  trackEvent('account_deleted');
}

/** Track referral conversion */
export function trackReferralConversion(referrerUid: string) {
  trackEvent('referral_conversion', {
    referrer_uid: referrerUid,
  });
}

/** Track seasonal challenge participation */
export function trackChallengeParticipation(challengeId: string) {
  trackEvent('challenge_participated', {
    challenge_id: challengeId,
  });
}

/** Track challenge completion */
export function trackChallengeCompleted(challengeId: string, xpEarned: number) {
  trackEvent('challenge_completed', {
    challenge_id: challengeId,
    xp_earned: xpEarned,
  });
}
