import type { ActTask } from '@/shared/types/task';

function pad2(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}

/** Local calendar YYYY-MM-DD (device timezone). */
export function localDateKey(d: Date): string {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

function addDaysToKey(key: string, deltaDays: number): string {
  const [y, m, day] = key.split('-').map(Number);
  const d = new Date(y, m - 1, day);
  d.setDate(d.getDate() + deltaDays);
  return localDateKey(d);
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

/**
 * Consecutive calendar days with at least one completed act.
 * If nothing is completed today, yesterday still counts as the streak anchor until it breaks.
 */
export function computeCompletionStreak(tasks: ActTask[]): number {
  const days = completionDaySet(tasks);
  if (days.size === 0) {
    return 0;
  }
  const today = localDateKey(new Date());
  const yesterday = addDaysToKey(today, -1);
  const anchor = days.has(today) ? today : days.has(yesterday) ? yesterday : null;
  if (anchor == null) {
    return 0;
  }
  let streak = 0;
  for (let cur = anchor; days.has(cur); cur = addDaysToKey(cur, -1)) {
    streak += 1;
  }
  return streak;
}
