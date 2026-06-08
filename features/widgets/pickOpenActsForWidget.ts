import type { ActTask, TaskCadence } from '@/shared/types/task';

const CADENCE_ORDER: Record<TaskCadence, number> = {
  daily: 0,
  weekly: 1,
  monthly: 2,
  anytime: 3,
};

/** Up to three open acts, prioritized like the in-app first-act suggestion. */
export function pickOpenActsForWidget(tasks: ActTask[], limit = 3): ActTask[] {
  const open = tasks.filter((t) => t.completedAt == null && t.active !== false);
  if (open.length === 0) {
    return [];
  }
  const sorted = [...open].sort((a, b) => {
    const cadence = (CADENCE_ORDER[a.cadence] ?? 9) - (CADENCE_ORDER[b.cadence] ?? 9);
    if (cadence !== 0) {
      return cadence;
    }
    return a.difficulty - b.difficulty;
  });
  return sorted.slice(0, limit);
}
