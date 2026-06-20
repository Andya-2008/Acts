import { computeLifetimeRankPromotionTransition } from '@/features/user-profile/config/xpServiceRanks';

import { useProgressionCelebrationStore } from './progressionCelebrationStore';

/** Queue a rank-up overlay when lifetime XP crosses a service-rank tier. */
export function enqueueRankUpIfPromotion(prevLifetimeXp: number, xpGain: number): void {
  if (xpGain <= 0) {
    return;
  }
  const transition = computeLifetimeRankPromotionTransition(prevLifetimeXp, xpGain);
  if (transition) {
    useProgressionCelebrationStore.getState().enqueueRankUp(transition);
  }
}
