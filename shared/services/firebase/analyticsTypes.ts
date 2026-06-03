/**
 * Analytics event types for Acts app
 * Used for type-safe event tracking
 */

export type AnalyticsEvent =
  | { type: 'task_completed'; taskId: string; difficulty: number; xpEarned: number }
  | { type: 'deed_posted'; hasPhoto: boolean; hasCaption: boolean }
  | { type: 'deed_engagement'; action: 'view' | 'react' | 'comment'; postId: string }
  | { type: 'friend_action'; action: 'add' | 'remove' | 'invite' }
  | { type: 'shop_purchase'; itemId: string; seedsCost: number; itemKind: string }
  | { type: 'achievement_unlocked'; achievementId: string }
  | { type: 'settings_changed'; setting: string; value: string | boolean }
  | { type: 'screen_view'; screenName: string }
  | { type: 'app_error'; errorType: string; errorMessage: string; severity: 'low' | 'medium' | 'high' }
  | { type: 'account_deleted' }
  | { type: 'referral_conversion'; referrerUid: string }
  | { type: 'challenge_participated'; challengeId: string }
  | { type: 'challenge_completed'; challengeId: string; xpEarned: number };

/**
 * Key metrics to monitor for Acts growth
 */
export interface ActsMetrics {
  // Daily Active Users (DAU) / Monthly Active Users (MAU)
  dau: number;
  mau: number;

  // Task completion rate
  tasksCompletedToday: number;
  usersWithAtLeastOneTaskToday: number;

  // Social engagement
  deedsPostedToday: number;
  deedEngagementRate: number; // % of users engaging with feed

  // Retention cohorts
  day1Retention: number; // % returning after 1 day
  day7Retention: number; // % returning after 7 days
  day30Retention: number; // % returning after 30 days

  // Shop conversion
  usersWhoShoppedAllTime: number;
  shopConversionRate: number; // % of DAU making purchases

  // Friends network
  averageFriendsPerUser: number;
  usersWithAtLeastOneFriend: number;
}

/**
 * Dashboard configuration for Firebase Analytics
 * Use these custom dimensions/metrics in Firebase Console
 */
export const FIREBASE_CUSTOM_DIMENSIONS = {
  // Dimensions
  USER_TYPE: 'dimension1', // 'new' | 'returning'
  TASK_DIFFICULTY: 'dimension2', // '1' | '2' | '3'
  CONTENT_TYPE: 'dimension3', // 'task' | 'deed' | 'shop'
  FEATURE_ACCESSED: 'dimension4', // feature name
  PLATFORM: 'dimension5', // 'iOS' | 'Android' | 'Web'

  // Metrics
  TASK_COMPLETION_TIME: 'metric1', // seconds
  STREAK_COUNT: 'metric2',
  TOTAL_XP: 'metric3',
  SEEDS_BALANCE: 'metric4',
  FRIENDS_COUNT: 'metric5',
};

/**
 * Key moments to track for funnel analysis
 */
export const FUNNEL_EVENTS = {
  // Sign-up funnel
  SIGN_UP_STARTED: 'sign_up_started',
  SIGN_UP_EMAIL_ENTERED: 'sign_up_email_entered',
  SIGN_UP_COMPLETED: 'sign_up_completed',

  // First task completion funnel
  FIRST_TASK_VIEWED: 'first_task_viewed',
  FIRST_TASK_STARTED: 'first_task_started',
  FIRST_TASK_COMPLETED: 'first_task_completed',

  // Deed post funnel
  DEED_POST_INITIATED: 'deed_post_initiated',
  DEED_POST_PHOTO_ADDED: 'deed_post_photo_added',
  DEED_POST_PUBLISHED: 'deed_post_published',

  // Shop conversion funnel
  SHOP_VIEWED: 'shop_viewed',
  SHOP_ITEM_VIEWED: 'shop_item_viewed',
  SHOP_PURCHASE_ATTEMPTED: 'shop_purchase_attempted',
  SHOP_PURCHASE_COMPLETED: 'shop_purchase_completed',
};
