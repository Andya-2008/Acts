import type { DerivedNotification } from '@/features/notifications/derivedNotifications';

export type NotificationInboxSection = {
  key: string;
  title: string;
  data: DerivedNotification[];
};

function startOfLocalDay(ms: number): number {
  const d = new Date(ms);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

function sectionTitleForTimestamp(timestampMs: number, nowMs: number): string {
  const todayStart = startOfLocalDay(nowMs);
  const dayStart = startOfLocalDay(timestampMs);

  if (dayStart >= todayStart) {
    return 'Today';
  }
  if (dayStart >= todayStart - 24 * 60 * 60 * 1000) {
    return 'Yesterday';
  }
  if (dayStart >= todayStart - 6 * 24 * 60 * 60 * 1000) {
    return 'This week';
  }
  return 'Earlier';
}

/** Groups inbox rows into Today / Yesterday / This week / Earlier. */
export function groupNotificationsByTime(
  items: DerivedNotification[],
  nowMs = Date.now(),
): NotificationInboxSection[] {
  const buckets = new Map<string, DerivedNotification[]>();
  const order = ['Today', 'Yesterday', 'This week', 'Earlier'];

  for (const item of items) {
    const title = sectionTitleForTimestamp(item.timestampMs, nowMs);
    const list = buckets.get(title) ?? [];
    list.push(item);
    buckets.set(title, list);
  }

  return order
    .filter((title) => (buckets.get(title)?.length ?? 0) > 0)
    .map((title) => ({
      key: title,
      title,
      data: buckets.get(title)!,
    }));
}
