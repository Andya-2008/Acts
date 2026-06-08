import { mergeActsDefaults, type ActsAppSettings } from '@/shared/types/actsSettings';
import {
  isWeekendDoubleActive,
  weekendDoubleOptionsFromSettings,
  weekendDoublePromoStorageKey,
} from '@/shared/utils/weekendDouble';
import { SHOP_ITEMS } from '@/features/shop/shopCatalog';

export type RewardedAdRewardType = 'streak_grace' | 'theme_trial' | 'weekend_double';

export type RewardedAdOffer = {
  type: RewardedAdRewardType;
  title: string;
  description: string;
  available: boolean;
  unavailableReason?: string;
};

function monthKey(d = new Date()): string {
  const pad = (n: number) => (n < 10 ? `0${n}` : String(n));
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;
}

function dayKey(d = new Date()): string {
  const pad = (n: number) => (n < 10 ? `0${n}` : String(n));
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function lockedAppearanceShopItems(shopPurchasedIds: string[] | undefined) {
  const owned = new Set(shopPurchasedIds ?? []);
  return SHOP_ITEMS.filter(
    (item) => item.kind === 'appearancePreset' && item.unlocksAppearancePresetId && !owned.has(item.id),
  );
}

export function buildRewardedAdOffers(
  acts: ActsAppSettings,
  shopPurchasedIds: string[] | undefined,
  now = new Date(),
): RewardedAdOffer[] {
  const month = monthKey(now);
  const day = dayKey(now);
  const lockedThemes = lockedAppearanceShopItems(shopPurchasedIds);
  const weekendOpts = weekendDoubleOptionsFromSettings(acts);
  const weekendActive = isWeekendDoubleActive(now, weekendOpts);
  const weekendKey = weekendDoublePromoStorageKey(now);

  const streakGraceAvailable =
    acts.rewardedAdStreakGraceMonth !== month &&
    Math.max(0, Math.floor(Number(acts.streakGraceBonusCredits ?? 0))) < 1;

  const themeTrialAvailable =
    acts.rewardedAdThemeTrialDay !== day && lockedThemes.length > 0;

  const weekendDoubleAvailable =
    weekendActive && Boolean(weekendKey) && acts.rewardedAdWeekendDoubleKey !== weekendKey;

  return [
    {
      type: 'streak_grace',
      title: 'Bonus streak save',
      description: 'Bank one extra streak save for a rainy day. Limit: one ad per month.',
      available: streakGraceAvailable,
      unavailableReason: streakGraceAvailable
        ? undefined
        : Math.max(0, Math.floor(Number(acts.streakGraceBonusCredits ?? 0))) >= 1
          ? 'You already have a bonus streak save banked.'
          : 'Come back next month for another bonus streak save.',
    },
    {
      type: 'theme_trial',
      title: '24h backdrop trial',
      description: 'Preview a premium Rewards backdrop for 24 hours. Limit: one ad per day.',
      available: themeTrialAvailable,
      unavailableReason: themeTrialAvailable
        ? undefined
        : lockedThemes.length === 0
          ? 'You already own every premium backdrop.'
          : 'You already unlocked a trial today. Try again tomorrow.',
    },
    {
      type: 'weekend_double',
      title: 'Extend double weekend',
      description: 'Keep double seeds & XP through Monday night. Limit: one ad per weekend.',
      available: weekendDoubleAvailable,
      unavailableReason: weekendDoubleAvailable
        ? undefined
        : !weekendActive
          ? 'Available Friday through Sunday during double weekends.'
          : 'You already extended this weekend.',
    },
  ];
}

export function defaultActsForRewardedAds(partial?: Partial<ActsAppSettings> | null): ActsAppSettings {
  return mergeActsDefaults(partial);
}
