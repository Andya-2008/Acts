import type { ActTask } from '@/shared/types/task';

export const WIN_BACK_INACTIVE_DAYS = 14;

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/** Latest `completedAt` across all tasks, or null if none completed. */
export function lastActCompletionMs(tasks: ActTask[]): number | null {
  let max = 0;
  for (const task of tasks) {
    if (task.completedAt == null) {
      continue;
    }
    try {
      const ms = task.completedAt.toMillis();
      if (ms > max) {
        max = ms;
      }
    } catch {
      /* skip malformed timestamp */
    }
  }
  return max > 0 ? max : null;
}

/** Whole days since the last completed act (local time). */
export function daysSinceLastActCompletion(lastCompletionMs: number | null, now = Date.now()): number | null {
  if (lastCompletionMs == null) {
    return null;
  }
  return Math.floor((now - lastCompletionMs) / MS_PER_DAY);
}

export function isWinBackInactive(lastCompletionMs: number | null, now = Date.now()): boolean {
  const days = daysSinceLastActCompletion(lastCompletionMs, now);
  return days != null && days >= WIN_BACK_INACTIVE_DAYS;
}
