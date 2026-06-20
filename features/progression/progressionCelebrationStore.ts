import { create } from 'zustand';

import type { AchievementDef } from '@/features/achievements/achievementCatalog';
import type { ServiceRankPromotionTransition } from '@/features/user-profile/config/xpServiceRanks';

export type ProgressionCelebrationItem =
  | { kind: 'rank_up'; payload: ServiceRankPromotionTransition }
  | { kind: 'streak_milestone'; days: number; title: string; message: string }
  | { kind: 'achievement'; achievement: AchievementDef };

type ProgressionCelebrationState = {
  queue: ProgressionCelebrationItem[];
  enqueue: (item: ProgressionCelebrationItem) => void;
  enqueueRankUp: (payload: ServiceRankPromotionTransition) => void;
  advance: () => void;
};

function queueHasItem(queue: ProgressionCelebrationItem[], item: ProgressionCelebrationItem): boolean {
  if (item.kind === 'rank_up') {
    return queue.some((q) => q.kind === 'rank_up' && q.payload.toTier.id === item.payload.toTier.id);
  }
  if (item.kind === 'achievement') {
    return queue.some((q) => q.kind === 'achievement' && q.achievement.id === item.achievement.id);
  }
  return queue.some((q) => q.kind === 'streak_milestone' && q.days === item.days);
}

export const useProgressionCelebrationStore = create<ProgressionCelebrationState>((set, get) => ({
  queue: [],
  enqueue: (item) => {
    set((state) => {
      if (queueHasItem(state.queue, item)) {
        return state;
      }
      return { queue: [...state.queue, item] };
    });
  },
  enqueueRankUp: (payload) => {
    get().enqueue({ kind: 'rank_up', payload });
  },
  advance: () => {
    set((state) => ({ queue: state.queue.slice(1) }));
  },
}));
