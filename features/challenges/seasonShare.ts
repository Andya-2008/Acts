import { Platform, Share } from 'react-native';

import type { SeasonalSeason } from '@/features/challenges/data/seasons';
import { totalSeasonLogs } from '@/features/challenges/seasonMilestones';
import type { SeasonProgress } from '@/features/challenges/seasonalChallengeRepository';
import { getInviteUrl } from '@/shared/config/appInvite';

export function buildSeasonShareMessage(
  season: SeasonalSeason,
  progress: Pick<SeasonProgress, 'totalXpEarned' | 'completions'>,
  uid?: string,
): string {
  const xp = Math.max(0, Math.floor(progress.totalXpEarned));
  const logs = totalSeasonLogs(progress.completions);
  const invite = getInviteUrl(uid);
  const xpLine =
    xp > 0
      ? `I've earned ${xp.toLocaleString()} bonus XP in Acts' ${season.name} challenges`
      : `I'm taking on Acts' ${season.name} challenges`;
  const logsLine = logs > 0 ? ` (${logs} kind acts logged so far)` : '';
  return `${xpLine}${logsLine}. Join me on Acts — one act of kindness at a time.\n\n${invite}`;
}

export async function shareSeasonProgress(
  season: SeasonalSeason,
  progress: Pick<SeasonProgress, 'totalXpEarned' | 'completions'>,
  uid?: string,
): Promise<boolean> {
  const message = buildSeasonShareMessage(season, progress, uid);
  const result = await Share.share({
    message,
    title: season.name,
    url: Platform.OS === 'ios' ? getInviteUrl(uid) : undefined,
  });
  return result.action !== Share.dismissedAction;
}
