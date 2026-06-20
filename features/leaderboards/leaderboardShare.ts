import { Platform, Share } from 'react-native';

import type { LeaderboardEntry } from '@/features/leaderboards/leaderboardRepository';
import { getInviteUrl } from '@/shared/config/appInvite';

function rankPhrase(rank: number, total: number): string {
  if (rank === 1) {
    return `#1 among ${total} friends`;
  }
  return `#${rank} of ${total} on my friends leaderboard`;
}

export function buildLeaderboardShareMessage(
  userRank: LeaderboardEntry,
  total: number,
  uid?: string,
): string {
  const invite = getInviteUrl(uid);
  return `I'm ${rankPhrase(userRank.rank, total)} in Acts with ${userRank.lifetimeXp.toLocaleString()} lifetime XP. Add me and let's keep each other going!\n\n${invite}`;
}

export async function shareLeaderboardRank(
  userRank: LeaderboardEntry,
  total: number,
  uid?: string,
): Promise<boolean> {
  const message = buildLeaderboardShareMessage(userRank, total, uid);
  const result = await Share.share({
    message,
    title: 'Friends Leaderboard',
    url: Platform.OS === 'ios' ? getInviteUrl(uid) : undefined,
  });
  return result.action !== Share.dismissedAction;
}
