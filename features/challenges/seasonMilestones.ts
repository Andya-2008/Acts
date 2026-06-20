/** Season bonus XP totals that trigger a milestone celebration / push. */
export const SEASON_XP_MILESTONES = [100, 250, 500, 1000, 2000, 5000] as const;

/** Total honor-system logs across all challenges in a season. */
export const SEASON_LOG_MILESTONES = [1, 5, 10, 25] as const;

export type SeasonMilestoneKind = 'xp' | 'logs';

export type SeasonMilestone = {
  kind: SeasonMilestoneKind;
  value: number;
};

export function totalSeasonLogs(completions: Record<string, number>): number {
  return Object.values(completions).reduce((sum, n) => sum + Math.max(0, Math.floor(n)), 0);
}

export function newlyCrossedXpMilestones(prevXp: number, nextXp: number): number[] {
  return SEASON_XP_MILESTONES.filter((m) => prevXp < m && nextXp >= m);
}

export function newlyCrossedLogMilestones(prevLogs: number, nextLogs: number): number[] {
  return SEASON_LOG_MILESTONES.filter((m) => prevLogs < m && nextLogs >= m);
}

/** Highest milestone crossed in this update (XP preferred over logs when both cross). */
export function pickCelebrationMilestone(
  prevXp: number,
  nextXp: number,
  prevLogs: number,
  nextLogs: number,
): SeasonMilestone | null {
  const xpCrossed = newlyCrossedXpMilestones(prevXp, nextXp);
  if (xpCrossed.length > 0) {
    return { kind: 'xp', value: Math.max(...xpCrossed) };
  }
  const logCrossed = newlyCrossedLogMilestones(prevLogs, nextLogs);
  if (logCrossed.length > 0) {
    return { kind: 'logs', value: Math.max(...logCrossed) };
  }
  return null;
}

export function milestoneTitle(milestone: SeasonMilestone): string {
  if (milestone.kind === 'xp') {
    return `${milestone.value.toLocaleString()} season XP`;
  }
  if (milestone.value === 1) {
    return 'your first seasonal challenge';
  }
  return `${milestone.value} seasonal logs`;
}

export function milestoneMessage(milestone: SeasonMilestone, seasonName: string): string {
  if (milestone.kind === 'xp') {
    return `You earned ${milestone.value.toLocaleString()} bonus XP in ${seasonName}.`;
  }
  if (milestone.value === 1) {
    return `You logged your first ${seasonName} challenge.`;
  }
  return `You logged ${milestone.value} ${seasonName} challenges this month.`;
}
