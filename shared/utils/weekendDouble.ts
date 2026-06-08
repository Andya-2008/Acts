/**
 * Double XP & seeds (currency) on **local** Friday-Sunday.
 * (JS: Fri=5, Sat=6, Sun=0)
 */

function pad2(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}

/** YYYY-MM-DD in local calendar for `d`. */
export function localYmd(d: Date): string {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

/** The Friday date (local) that anchors the Fri-Sun window containing `d`, or null if not weekend. */
export function fridayYmdOfWeekendContaining(d = new Date()): string | null {
  const day = d.getDay();
  if (day !== 0 && day !== 5 && day !== 6) {
    return null;
  }
  const x = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  if (day === 6) {
    x.setDate(x.getDate() - 1);
  } else if (day === 0) {
    x.setDate(x.getDate() - 2);
  }
  return localYmd(x);
}

export type WeekendDoubleOptions = {
  /** ISO timestamp from rewarded-ad Monday extension. */
  extendedUntilIso?: string | null;
};

export function isWeekendDoubleActive(now = new Date(), options?: WeekendDoubleOptions): boolean {
  if (fridayYmdOfWeekendContaining(now) != null) {
    return true;
  }
  const raw = options?.extendedUntilIso?.trim();
  if (!raw) {
    return false;
  }
  const until = Date.parse(raw);
  return !Number.isNaN(until) && now.getTime() <= until;
}

export function weekendDoubleOptionsFromSettings(
  settings?: { weekendDoubleExtendedUntil?: string | null } | null,
): WeekendDoubleOptions {
  return { extendedUntilIso: settings?.weekendDoubleExtendedUntil ?? null };
}

/** Storage key for “already showed promo this weekend”. */
export function weekendDoublePromoStorageKey(now = new Date()): string | null {
  const fri = fridayYmdOfWeekendContaining(now);
  return fri ? `weekend_double_${fri}` : null;
}

/** Positive earn amounts (seeds, XP grants) are doubled on weekend. */
export function weekendDoubleEarnedAmount(
  base: number,
  now = new Date(),
  options?: WeekendDoubleOptions,
): number {
  const b = Math.floor(Number(base));
  if (!isWeekendDoubleActive(now, options) || b <= 0) {
    return b;
  }
  return b * 2;
}

/** XP delta: only positive gains are doubled; penalties unchanged. */
export function weekendDoubleXpDelta(
  delta: number,
  now = new Date(),
  options?: WeekendDoubleOptions,
): number {
  const d = Math.trunc(Number(delta));
  if (d <= 0) {
    return d;
  }
  return isWeekendDoubleActive(now, options) ? d * 2 : d;
}

/** End of Monday (local) for the Fri–Sun window containing `now`. */
export function endOfMondayAfterWeekendIso(now = new Date()): string | null {
  const day = now.getDay();
  if (day !== 0 && day !== 5 && day !== 6) {
    return null;
  }
  const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (day === 5) {
    monday.setDate(monday.getDate() + 3);
  } else if (day === 6) {
    monday.setDate(monday.getDate() + 2);
  } else {
    monday.setDate(monday.getDate() + 1);
  }
  monday.setHours(23, 59, 59, 999);
  return monday.toISOString();
}
