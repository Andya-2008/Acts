import type { ActTask, TaskCadence } from '@/shared/types/task';
import type { UserInfoRead } from '@/shared/types/userInfo';

import { scoreTaskOnboardingMatch } from '@/features/tasks/utils/taskOnboardingPreference';

const CADENCE_ORDER: Record<TaskCadence, number> = {
  daily: 0,
  weekly: 1,
  monthly: 2,
  anytime: 3,
};

/** Best act to suggest for a brand-new user (easy, soon cadence, not done). */
export function pickFirstActCandidate(
  tasks: ActTask[],
  user?: UserInfoRead | null,
): ActTask | null {
  const open = tasks.filter((t) => t.completedAt == null && t.active !== false);
  if (open.length === 0) {
    return null;
  }
  const sorted = [...open].sort((a, b) => {
    const cadence =
      (CADENCE_ORDER[a.cadence] ?? 9) - (CADENCE_ORDER[b.cadence] ?? 9);
    if (cadence !== 0) {
      return cadence;
    }
    const difficulty = a.difficulty - b.difficulty;
    if (difficulty !== 0) {
      return difficulty;
    }
    return scoreTaskOnboardingMatch(b, user) - scoreTaskOnboardingMatch(a, user);
  });
  return sorted[0] ?? null;
}
