import type { ComponentProps } from 'react';
import Ionicons from '@expo/vector-icons/Ionicons';

type IonName = ComponentProps<typeof Ionicons>['name'];

export type ServiceRankTier = {
  id: string;
  minXp: number;
  label: string;
  /** Short flavor line for profile / tooltips */
  tagline: string;
  icon: IonName;
};

/**
 * Ordered tiers; highest matching `minXp` wins. Tuned so steady play unlocks over weeks.
 */
export const SERVICE_RANK_TIERS: ServiceRankTier[] = [
  {
    id: 'sprouting',
    minXp: 0,
    label: 'Sprouting Service',
    tagline: 'Every good deed starts small.',
    icon: 'leaf-outline',
  },
  {
    id: 'growing_heart',
    minXp: 60,
    label: 'Growing Heart',
    tagline: 'Kindness is taking root.',
    icon: 'heart-outline',
  },
  {
    id: 'steady_helper',
    minXp: 180,
    label: 'Steady Helper',
    tagline: 'You keep showing up.',
    icon: 'hand-left-outline',
  },
  {
    id: 'bright_citizen',
    minXp: 400,
    label: 'Bright Citizen',
    tagline: 'Your light is easy to spot.',
    icon: 'sunny-outline',
  },
  {
    id: 'radiant_changemaker',
    minXp: 850,
    label: 'Radiant Changemaker',
    tagline: 'Momentum that lifts others.',
    icon: 'flash-outline',
  },
  {
    id: 'luminary_path',
    minXp: 1600,
    label: 'Luminary Path',
    tagline: 'Rare dedication to doing good.',
    icon: 'star-outline',
  },
  {
    id: 'golden_do_gooder',
    minXp: 3200,
    label: 'Golden Do-gooder',
    tagline: 'Legendary heart. Keep shining.',
    icon: 'medal-outline',
  },
];

export type ServiceRankView = {
  tier: ServiceRankTier;
  /** 0–1 progress toward the *next* tier, or 1 if at max */
  progressToNext: number;
  /** XP above current tier floor */
  xpIntoTier: number;
  /** XP needed to reach next tier from 0 (null if max tier) */
  nextTierMinXp: number | null;
  /** Delta XP until next tier */
  xpUntilNext: number | null;
};

/**
 * When lifetime XP increases by `xpGain`, returns previous and new tiers if the user
 * crossed into a higher tier; otherwise `null`.
 */
export type ServiceRankPromotionTransition = {
  fromTier: ServiceRankTier;
  toTier: ServiceRankTier;
};

export function computeLifetimeRankPromotionTransition(
  prevLifetimeXp: number,
  xpGain: number,
): ServiceRankPromotionTransition | null {
  if (xpGain <= 0) {
    return null;
  }
  const before = getServiceRankForLifetimeXp(prevLifetimeXp);
  const after = getServiceRankForLifetimeXp(prevLifetimeXp + xpGain);
  const beforeI = SERVICE_RANK_TIERS.findIndex((t) => t.id === before.tier.id);
  const afterI = SERVICE_RANK_TIERS.findIndex((t) => t.id === after.tier.id);
  return afterI > beforeI ? { fromTier: before.tier, toTier: after.tier } : null;
}

/** Returns only the new tier (for callers that do not need the transition). */
export function computeLifetimeRankPromotionAfterGain(prevLifetimeXp: number, xpGain: number): ServiceRankTier | null {
  return computeLifetimeRankPromotionTransition(prevLifetimeXp, xpGain)?.toTier ?? null;
}

export function getServiceRankForLifetimeXp(lifetimeXp: number): ServiceRankView {
  const xp = Math.max(0, Math.floor(lifetimeXp));
  let idx = 0;
  for (let i = 0; i < SERVICE_RANK_TIERS.length; i++) {
    if (xp >= SERVICE_RANK_TIERS[i]!.minXp) {
      idx = i;
    }
  }
  const tier = SERVICE_RANK_TIERS[idx]!;
  const next = SERVICE_RANK_TIERS[idx + 1];
  if (!next) {
    return {
      tier,
      progressToNext: 1,
      xpIntoTier: xp - tier.minXp,
      nextTierMinXp: null,
      xpUntilNext: null,
    };
  }
  const span = next.minXp - tier.minXp;
  const into = xp - tier.minXp;
  const progress = span > 0 ? Math.min(1, Math.max(0, into / span)) : 1;
  return {
    tier,
    progressToNext: progress,
    xpIntoTier: into,
    nextTierMinXp: next.minXp,
    xpUntilNext: Math.max(0, next.minXp - xp),
  };
}
