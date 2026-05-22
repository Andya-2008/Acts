import type { TaskCadence } from '@/shared/types/task';

function pad2(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}

/** Local calendar YYYY-MM-DD (device timezone). */
export function localDateKey(d: Date): string {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

/** Monday-start week; period = calendar date of that Monday (local). */
export function startOfWeekMonday(d: Date): Date {
  const x = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const offset = (x.getDay() + 6) % 7;
  x.setDate(x.getDate() - offset);
  return x;
}

export function weekPeriodKey(d: Date): string {
  return localDateKey(startOfWeekMonday(d));
}

/** Calendar month `YYYY-MM` (local). */
export function calendarMonthKey(d: Date): string {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}`;
}

export function periodKeyForDate(cadence: TaskCadence, d: Date): string | null {
  if (cadence === 'daily') {
    return localDateKey(d);
  }
  if (cadence === 'weekly') {
    return weekPeriodKey(d);
  }
  if (cadence === 'monthly') {
    return calendarMonthKey(d);
  }
  return null;
}

export function currentPeriodKey(cadence: TaskCadence, now: Date = new Date()): string | null {
  return periodKeyForDate(cadence, now);
}

export function currentRosterPeriodKeys(now: Date = new Date()): {
  daily: string | null;
  weekly: string | null;
  monthly: string | null;
} {
  return {
    daily: periodKeyForDate('daily', now),
    weekly: periodKeyForDate('weekly', now),
    monthly: periodKeyForDate('monthly', now),
  };
}
