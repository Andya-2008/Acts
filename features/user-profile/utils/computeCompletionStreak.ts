import type { ActTask } from '@/shared/types/task';
import type { ActsAppSettings } from '@/shared/types/actsSettings';

function pad2(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}

/** Local calendar YYYY-MM-DD (device timezone). */
export function localDateKey(d: Date): string {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

/** Calendar month YYYY-MM (device timezone). */
export function calendarMonthKey(d: Date): string {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}`;
}

function addDaysToKey(key: string, deltaDays: number): string {
  const [y, m, day] = key.split('-').map(Number);
  const dt = new Date(y, m - 1, day);
  dt.setDate(dt.getDate() + deltaDays);
  return localDateKey(dt);
}

export type StreakGraceSlice = Pick<
  ActsAppSettings,
  | 'streakGraceForgivenDayKey'
  | 'streakGraceAppliedInMonth'
  | 'streakGraceAdForgivenDayKey'
  | 'streakGraceAdAppliedInMonth'
>;

function applyGraceDays(days: Set<string>, grace: StreakGraceSlice | null | undefined, monthKey: string): void {
  if (grace?.streakGraceForgivenDayKey && grace.streakGraceAppliedInMonth === monthKey) {
    days.add(grace.streakGraceForgivenDayKey);
  }
  if (grace?.streakGraceAdForgivenDayKey && grace.streakGraceAdAppliedInMonth === monthKey) {
    days.add(grace.streakGraceAdForgivenDayKey);
  }
}

function completionDaySet(tasks: ActTask[]): Set<string> {
  const set = new Set<string>();
  for (const t of tasks) {
    if (t.completedAt == null) {
      continue;
    }
    set.add(localDateKey(t.completedAt.toDate()));
  }
  return set;
}

/** True when at least one act was completed on the given local calendar day. */
export function completedOnLocalDay(tasks: ActTask[], dayKey: string): boolean {
  for (const t of tasks) {
    if (t.completedAt == null) {
      continue;
    }
    if (localDateKey(t.completedAt.toDate()) === dayKey) {
      return true;
    }
  }
  return false;
}

function streakFromAnchor(days: Set<string>, anchor: string): number {
  let streak = 0;
  for (let cur = anchor; days.has(cur); cur = addDaysToKey(cur, -1)) {
    streak += 1;
  }
  return streak;
}

/**
 * Consecutive calendar days with at least one completed act.
 * If nothing is completed today, yesterday still counts as the streak anchor until it breaks.
 *
 * Optional **monthly streak grace**: when `streakGraceAppliedInMonth` matches the current month
 * and `streakGraceForgivenDayKey` is set, that day is treated as completed for counting only
 * (one forgiven miss you activated from Tasks).
 */
export function computeCompletionStreak(tasks: ActTask[], grace?: StreakGraceSlice | null): number {
  const days = completionDaySet(tasks);
  const now = new Date();
  const monthKey = calendarMonthKey(now);
  applyGraceDays(days, grace, monthKey);
  if (days.size === 0) {
    return 0;
  }
  const today = localDateKey(now);
  const yesterday = addDaysToKey(today, -1);
  const anchor = days.has(today) ? today : days.has(yesterday) ? yesterday : null;
  if (anchor == null) {
    return 0;
  }
  return streakFromAnchor(days, anchor);
}

/**
 * True when the user missed exactly yesterday (no completion today or yesterday) but completed
 * the day before, so their streak would drop to 0 without using this month's grace save.
 */
export function canOfferStreakGraceSave(tasks: ActTask[], grace?: StreakGraceSlice | null): {
  show: boolean;
  forgivenDayKey: string | null;
} {
  const now = new Date();
  const monthKey = calendarMonthKey(now);
  if (grace?.streakGraceAppliedInMonth === monthKey) {
    return { show: false, forgivenDayKey: null };
  }
  const today = localDateKey(now);
  const yesterday = addDaysToKey(today, -1);
  const dayBefore = addDaysToKey(today, -2);
  const days = completionDaySet(tasks);
  if (days.has(today) || days.has(yesterday)) {
    return { show: false, forgivenDayKey: null };
  }
  if (streakFromAnchor(days, dayBefore) < 1) {
    return { show: false, forgivenDayKey: null };
  }
  const strict = computeCompletionStreak(tasks, null);
  if (strict !== 0) {
    return { show: false, forgivenDayKey: null };
  }
  const trial = new Set(days);
  trial.add(yesterday);
  const anchor = trial.has(today) ? today : trial.has(yesterday) ? yesterday : null;
  if (anchor == null) {
    return { show: false, forgivenDayKey: null };
  }
  if (streakFromAnchor(trial, anchor) <= 0) {
    return { show: false, forgivenDayKey: null };
  }
  return { show: true, forgivenDayKey: yesterday };
}
