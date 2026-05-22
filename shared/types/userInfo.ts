import type { FieldValue, Timestamp } from 'firebase/firestore';

import type { ActsAppSettings } from '@/shared/types/actsSettings';

/**
 * Firestore `userInfo/{uid}` shape aligned with the Acts Firebase project.
 * Field names match console casing (including `Date Joined`).
 */
export type UserInfoDoc = {
  DOB: string;
  'Date Joined': Timestamp | FieldValue;
  Email: string;
  First: string;
  Last: string;
  Phone: string;
  Traits: string[];
  UserConfig: boolean;
  Username: string;
  profilePicUrl: string | null;
  /** Kindness / heart points balance — shown in-app as **Seeds** (shop currency). */
  HeartPoints?: number;
  /** Total XP from good deeds (monotonic; never reduced when un-completing tasks). */
  LifetimeXP?: number;
  /** One-time shop purchases (item ids from `SHOP_ITEMS` in `features/shop/shopCatalog.ts`). */
  ShopPurchasedIds?: string[];
  /** Other user ids this account has blocked (client filters feed; unblock in Settings → Privacy). */
  BlockedUids?: string[];
  /** Expo push token for future friend/social alerts (written when notification permission granted). */
  ExpoPushToken?: string;
  ExpoPushTokenUpdatedAt?: Timestamp | FieldValue;
};

/** Written after onboarding; optional on older documents. */
export type UserInfoOnboardingFields = {
  /** Mobile number for contact-based friend matching (stored on profile). */
  Phone: string;
  Hobbies: string[];
  Interests: string[];
  FavoriteActivities: string[];
  Goals: string[];
  GrowthGoals: string[];
  PersonalityTraits: string[];
  TaskDifficulty: 'easy' | 'medium' | 'hard';
  HasKids: boolean;
  BecomeCategory: string;
};

export type UserInfoRead = UserInfoDoc &
  Partial<UserInfoOnboardingFields> & {
    ActsSettings?: Partial<ActsAppSettings>;
  };
