import type { TaskCadence } from '@/shared/types/task';

/** In-app reward when a task is marked complete (by cadence). */
export function rewardForCadence(cadence: TaskCadence): number {
  switch (cadence) {
    case 'daily':
      return 10;
    case 'weekly':
      return 30;
    case 'monthly':
      return 50;
    case 'anytime':
    default:
      return 0;
  }
}
