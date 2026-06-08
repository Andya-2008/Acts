import {
  calendarMonthKey,
  canOfferStreakGraceSave,
  type StreakGraceSlice,
} from '@/features/user-profile/utils/computeCompletionStreak';
import type { ActsAppSettings } from '@/shared/types/actsSettings';
import type { ActTask } from '@/shared/types/task';

export type BonusStreakGraceSlice = StreakGraceSlice &
  Pick<ActsAppSettings, 'streakGraceBonusCredits'>;

/** True when the user can spend a banked bonus streak save from a rewarded ad. */
export function canUseBonusStreakGrace(
  tasks: ActTask[],
  grace?: BonusStreakGraceSlice | null,
): { show: boolean; forgivenDayKey: string | null } {
  const credits = Math.max(0, Math.floor(Number(grace?.streakGraceBonusCredits ?? 0)));
  if (credits < 1) {
    return { show: false, forgivenDayKey: null };
  }
  const monthKey = calendarMonthKey(new Date());
  if (grace?.streakGraceAdAppliedInMonth === monthKey && grace.streakGraceAdForgivenDayKey) {
    return { show: false, forgivenDayKey: null };
  }
  return canOfferStreakGraceSave(tasks, grace);
}
