import type { ActAppearanceColorPresetId } from '@/shared/theme/appearancePalettes';
import { normalizeProfileBio } from '@/shared/constants/profileBio';

/** Who can see a profile stat (rank, streak, XP, acts count) besides you — you always see your own. */
export type ProfileStatVisibility = 'public' | 'friends_only' | 'only_me';

/** Calendar period keys for the user's rotating home roster (local device timezone). */
export type TaskRosterPeriodKeys = {
  daily?: string;
  weekly?: string;
  monthly?: string;
};

export const PROFILE_STAT_VISIBILITY_OPTIONS: { key: ProfileStatVisibility; label: string }[] = [
  { key: 'public', label: 'Public' },
  { key: 'friends_only', label: 'Friends Only' },
  { key: 'only_me', label: 'Only Me' },
];

/**
 * Optional app settings stored on `userInfo/{uid}.ActsSettings` (Firestore dot paths).
 * All fields optional on read; UI uses defaults when missing.
 */
export type ActsAppSettings = {
  /** In-app color preset (see `ActAppearanceProvider`). */
  appearanceColorPreset: ActAppearanceColorPresetId;
  /** Extra headroom for iOS Larger Text (works with Settings → Accessibility → Larger Text). */
  appearanceComfortableText: boolean;
  /** Extra horizontal padding on main screens. */
  appearanceSpaciousLayout: boolean;
  preferredDifficulty: 'easy' | 'medium' | 'hard';
  timeCommitmentMinutesPerDay: number;
  photoComfortYes: boolean;
  gender: 'male' | 'female' | 'other' | 'prefer_not';
  deedFeedVisibility: 'friends_only' | 'only_me';
  taskHistoryVisibility: 'friends_only' | 'only_me';
  profileServiceRankVisibility: ProfileStatVisibility;
  profileStreakVisibility: ProfileStatVisibility;
  profileXpVisibility: ProfileStatVisibility;
  profileActsCompletedVisibility: ProfileStatVisibility;
  allowFriendRequests: boolean;
  feedSharing: boolean;
  reactionsEnabled: boolean;
  notifyFriendsPosting: boolean;
  notifyStreakWarning: boolean;
  notifyFriendsReactions: boolean;
  notifyFriendRequests: boolean;
  notifyFriendRequestAccepted: boolean;
  notifyNewActs: boolean;
  notifyIncompleteActWarning: boolean;
  /** Local reminder: gentle nudge to complete an act (time of day below). */
  notifyDailyReminder: boolean;
  /** Sunday evening recap (local notifications). */
  notifyWeeklyRecap: boolean;
  /** Friday morning: double seeds/XP weekend promo (local). */
  notifyWeekendDoublePromo: boolean;
  /** Monday morning: nudge for weekly cadence acts (local). */
  notifyWeeklyActReminder: boolean;
  /** First of month: nudge for monthly cadence acts (local). */
  notifyMonthlyActReminder: boolean;
  /** Local hour (0–23) for daily reminder; incomplete nudge is +3h (capped 9 PM). */
  retentionDailyReminderHour: number;
  /** Forgiving a single missed calendar day for streak counting (YYYY-MM-DD). */
  streakGraceForgivenDayKey?: string;
  /** Calendar month (YYYY-MM) when streak grace was last applied. */
  streakGraceAppliedInMonth?: string;
  autosavePhotos: boolean;
  profileTitle: string;
  cityState: string;
  /**
   * Short profile bio (max 50 chars). Always public to every signed-in Acts member;
   * not affected by stat visibility settings.
   */
  bio: string;
  /**
   * Cosmetic: checkbox chrome on the tasks list (`TaskCheckThemeId`).
   * Must match a purchased shop theme or stay `default`.
   */
  activeTaskCheckTheme: string;
  /** Last roster period synced per cadence (`YYYY-MM-DD`, week Monday, or `YYYY-MM`). */
  taskRosterPeriodKeys?: TaskRosterPeriodKeys;
};

export const DEFAULT_ACTS_SETTINGS: ActsAppSettings = {
  appearanceColorPreset: 'blossom',
  appearanceComfortableText: false,
  appearanceSpaciousLayout: false,
  preferredDifficulty: 'medium',
  timeCommitmentMinutesPerDay: 15,
  photoComfortYes: true,
  gender: 'prefer_not',
  deedFeedVisibility: 'friends_only',
  taskHistoryVisibility: 'friends_only',
  profileServiceRankVisibility: 'public',
  profileStreakVisibility: 'public',
  profileXpVisibility: 'public',
  profileActsCompletedVisibility: 'public',
  allowFriendRequests: true,
  feedSharing: true,
  reactionsEnabled: true,
  notifyFriendsPosting: true,
  notifyStreakWarning: true,
  notifyFriendsReactions: true,
  notifyFriendRequests: true,
  notifyFriendRequestAccepted: true,
  notifyNewActs: true,
  notifyIncompleteActWarning: true,
  notifyDailyReminder: true,
  notifyWeeklyRecap: true,
  notifyWeekendDoublePromo: true,
  notifyWeeklyActReminder: true,
  notifyMonthlyActReminder: true,
  retentionDailyReminderHour: 18,
  autosavePhotos: true,
  profileTitle: '',
  cityState: '',
  bio: '',
  activeTaskCheckTheme: 'default',
};

export function mergeActsDefaults(partial?: Partial<ActsAppSettings> | null): ActsAppSettings {
  const p = partial ?? {};
  const merged: ActsAppSettings = { ...DEFAULT_ACTS_SETTINGS, ...p };
  merged.bio = typeof p.bio === 'string' ? normalizeProfileBio(p.bio) : DEFAULT_ACTS_SETTINGS.bio;
  if (p.profileServiceRankVisibility === undefined) {
    const legacyHideRank = (p as { profileShowServiceRank?: boolean }).profileShowServiceRank === false;
    if (legacyHideRank) {
      merged.profileServiceRankVisibility = 'only_me';
    }
  }
  delete (merged as Record<string, unknown>).profileShowServiceRank;
  return merged;
}
