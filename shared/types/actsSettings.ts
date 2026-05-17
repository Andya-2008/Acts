import type { ActAppearanceColorPresetId } from '@/shared/theme/appearancePalettes';

/**
 * Optional app settings stored on `userInfo/{uid}.ActsSettings` (Firestore dot paths).
 * All fields optional on read; UI uses defaults when missing.
 */
export type ActsAppSettings = {
  /** In-app color preset (see `ActAppearanceProvider`). */
  appearanceColorPreset: ActAppearanceColorPresetId;
  /** Allows slightly larger dynamic type scaling for readability. */
  appearanceComfortableText: boolean;
  /** Extra horizontal padding on main screens. */
  appearanceSpaciousLayout: boolean;
  preferredDifficulty: 'easy' | 'medium' | 'hard';
  timeCommitmentMinutesPerDay: number;
  photoComfortYes: boolean;
  gender: 'male' | 'female' | 'other' | 'prefer_not';
  deedFeedVisibility: 'friends_only' | 'only_me';
  taskHistoryVisibility: 'friends_only' | 'only_me';
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
  autosavePhotos: boolean;
  profileTitle: string;
  cityState: string;
  /** Short public profile bio; visible to everyone signed in. */
  bio: string;
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
  autosavePhotos: true,
  profileTitle: '',
  cityState: '',
  bio: '',
};

export function mergeActsDefaults(partial?: Partial<ActsAppSettings> | null): ActsAppSettings {
  return { ...DEFAULT_ACTS_SETTINGS, ...(partial ?? {}) };
}
