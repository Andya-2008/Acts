import { pickOpenActsForWidget } from '@/features/widgets/pickOpenActsForWidget';
import {
  computeCompletionStreak,
  localDateKey,
  type StreakGraceSlice,
} from '@/features/user-profile/utils/computeCompletionStreak';
import type { ActTask } from '@/shared/types/task';
import type { WidgetSnapshot } from '@/shared/types/widgetSnapshot';

export function buildWidgetSnapshot(
  tasks: ActTask[] | undefined,
  grace?: StreakGraceSlice | null,
): WidgetSnapshot {
  const list = tasks ?? [];
  const streak = computeCompletionStreak(list, grace);
  const today = localDateKey(new Date());
  const completedToday = list.some(
    (t) => t.completedAt != null && localDateKey(t.completedAt.toDate()) === today,
  );
  const openActs = pickOpenActsForWidget(list);
  const openTaskCount = list.filter((t) => t.completedAt == null && t.active !== false).length;

  return {
    streak,
    completedToday,
    openTaskCount,
    tasks: openActs.map((t) => ({
      id: t.id,
      title: t.textShort?.trim() || t.textLong?.trim() || 'Act',
    })),
    updatedAt: new Date().toISOString(),
  };
}
