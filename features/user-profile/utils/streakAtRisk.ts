import {
  completedOnLocalDay,
  computeCompletionStreak,
  localDateKey,
  type StreakGraceSlice,
} from '@/features/user-profile/utils/computeCompletionStreak';
import type { ActTask } from '@/shared/types/task';

/** In-app streak nudge appears from this local hour until midnight. */
export const STREAK_NUDGE_START_HOUR = 14;

export type StreakAtRiskState = {
  show: boolean;
  streakDays: number;
  minutesUntilMidnight: number;
};

function minutesUntilLocalMidnight(now: Date): number {
  const end = new Date(now);
  end.setHours(24, 0, 0, 0);
  return Math.max(0, Math.floor((end.getTime() - now.getTime()) / 60_000));
}

/**
 * User has an active streak but has not completed an act today — one completion
 * before midnight keeps the run alive. Shown in-app from mid-afternoon onward.
 */
export function getStreakAtRiskState(
  tasks: ActTask[],
  grace?: StreakGraceSlice | null,
  now = new Date(),
): StreakAtRiskState {
  const empty = { show: false, streakDays: 0, minutesUntilMidnight: minutesUntilLocalMidnight(now) };
  const today = localDateKey(now);
  if (completedOnLocalDay(tasks, today)) {
    return empty;
  }

  const streakDays = computeCompletionStreak(tasks, grace ?? null);
  if (streakDays < 1) {
    return empty;
  }

  if (now.getHours() < STREAK_NUDGE_START_HOUR) {
    return { ...empty, streakDays, minutesUntilMidnight: minutesUntilLocalMidnight(now) };
  }

  return {
    show: true,
    streakDays,
    minutesUntilMidnight: minutesUntilLocalMidnight(now),
  };
}

/** Human copy for time left today (e.g. "About 3 hours left today"). */
export function streakTimeLeftLabel(minutesUntilMidnight: number): string {
  if (minutesUntilMidnight < 60) {
    return 'Less than an hour left today';
  }
  const hours = Math.round(minutesUntilMidnight / 60);
  if (hours === 1) {
    return 'About 1 hour left today';
  }
  return `About ${hours} hours left today`;
}
