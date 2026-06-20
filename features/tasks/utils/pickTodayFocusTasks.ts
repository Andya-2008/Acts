import type { ActTask, TaskCadence } from '@/shared/types/task';
import type { UserInfoRead } from '@/shared/types/userInfo';

import { scoreTaskOnboardingMatch } from '@/features/tasks/utils/taskOnboardingPreference';

const CADENCE_ORDER: Record<TaskCadence, number> = {
  daily: 0,
  weekly: 1,
  monthly: 2,
  anytime: 3,
};

function focusRank(task: ActTask, user?: UserInfoRead | null): number {
  const cadence = CADENCE_ORDER[task.cadence] ?? 9;
  const difficulty = task.difficulty;
  const personal = scoreTaskOnboardingMatch(task, user);
  return cadence * 1000 + difficulty * 100 - personal;
}

/** Up to `limit` incomplete acts to highlight in focus view (daily + easy first). */
export function pickTodayFocusTasks(
  tasks: ActTask[],
  user?: UserInfoRead | null,
  limit = 3,
): ActTask[] {
  const open = tasks.filter((t) => t.completedAt == null && t.active !== false);
  if (open.length <= limit) {
    return open;
  }

  const ranked = [...open].sort((a, b) => focusRank(a, user) - focusRank(b, user));
  const picked: ActTask[] = [];
  const usedCategories = new Set<string>();

  for (const task of ranked) {
    if (picked.length >= limit) {
      break;
    }
    const cat = task.category?.trim() || 'general';
    const needDiversity = picked.length < limit - 1;
    if (!needDiversity || !usedCategories.has(cat) || usedCategories.size >= limit - 1) {
      picked.push(task);
      usedCategories.add(cat);
    }
  }

  for (const task of ranked) {
    if (picked.length >= limit) {
      break;
    }
    if (!picked.some((p) => p.id === task.id)) {
      picked.push(task);
    }
  }

  return picked;
}
