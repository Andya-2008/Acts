import type { ActsAppSettings } from '@/shared/types/actsSettings';

/** Maps personalization difficulty to catalog `difficulty` (1-3). */
export function preferredDifficultyLevelFromActs(
  difficulty: ActsAppSettings['preferredDifficulty'],
): 1 | 2 | 3 {
  if (difficulty === 'easy') {
    return 1;
  }
  if (difficulty === 'hard') {
    return 3;
  }
  return 2;
}
