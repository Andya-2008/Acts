import type { TaskCadence } from '@/shared/types/task';

/** XP granted when a task is marked complete (removed again if the completion is undone). */
export function xpForCadence(cadence: TaskCadence): number {
  switch (cadence) {
    case 'daily':
      return 15;
    case 'weekly':
      return 40;
    case 'monthly':
      return 85;
    case 'anytime':
    default:
      return 5;
  }
}

/** XP for sharing a task memory to the deed feed. */
export const XP_FOR_DEED_FEED_SHARE = 25;
