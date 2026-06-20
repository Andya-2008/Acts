import { ACHIEVEMENT_BY_ID } from '@/features/achievements/achievementCatalog';

/** Streak lengths that get a dedicated celebration moment. */
export const STREAK_MILESTONE_DAYS = [3, 7, 14, 30, 60, 90, 180, 365] as const;

export function newlyCrossedStreakMilestones(prevDays: number, nextDays: number): number[] {
  if (nextDays <= prevDays) {
    return [];
  }
  return STREAK_MILESTONE_DAYS.filter((days) => prevDays < days && nextDays >= days);
}

export function streakMilestoneTitle(days: number): string {
  if (days === 1) {
    return 'Day one';
  }
  if (days === 7) {
    return 'One-week streak';
  }
  if (days === 30) {
    return '30-day streak';
  }
  if (days === 365) {
    return 'One-year streak';
  }
  return `${days}-day streak`;
}

export function streakMilestoneMessage(days: number): string {
  if (days === 3) {
    return 'Three days in a row. Momentum is building.';
  }
  if (days === 7) {
    return 'A full week of showing up. That is a real habit.';
  }
  if (days === 14) {
    return 'Two weeks strong. Keep the flame going.';
  }
  if (days === 30) {
    return 'A month of kindness. That takes commitment.';
  }
  if (days === 60) {
    return 'Sixty days of steady heart. Rare dedication.';
  }
  if (days === 90) {
    return 'Ninety days. You are in it for the long haul.';
  }
  if (days === 180) {
    return 'Half a year of daily light. Incredible.';
  }
  if (days === 365) {
    return 'A full year of acts. Legendary consistency.';
  }
  return `${days} days in a row. Keep shining.`;
}

export function achievementIdForStreakDays(days: number): string | null {
  const id = `streak_${days}`;
  return ACHIEVEMENT_BY_ID[id] ? id : null;
}
