import { fetchFriendUids } from '@/features/friends/services/friendsRepository';
import { fetchUserInfo } from '@/features/user-profile/services/userInfoRepository';
import type { UserInfoRead } from '@/shared/types/userInfo';

/**
 * Friends leaderboard for Acts.
 *
 * Privacy note: `userInfo` documents are readable one-by-one (`get`) but cannot be
 * listed/queried by clients (see `firestore.rules` → `allow list: if false`). A global
 * "all users" leaderboard would require either opening up user listing (a privacy
 * regression) or a server-maintained aggregate collection. We therefore rank the
 * signed-in user against their accepted friends, which only needs per-user `get` reads.
 */

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  displayName: string;
  profilePicUrl: string | null;
  lifetimeXp: number;
}

export interface FriendsLeaderboard {
  entries: LeaderboardEntry[];
  /** The signed-in user's own row (already included in `entries`). */
  userRank?: LeaderboardEntry;
}

function displayNameFromUserInfo(info: UserInfoRead): string {
  const fullName = [info.First, info.Last].filter(Boolean).join(' ').trim();
  return fullName || info.Username?.trim() || 'Acts member';
}

function lifetimeXpFromUserInfo(info: UserInfoRead): number {
  return Math.max(0, Math.floor(Number(info.LifetimeXP ?? 0)));
}

/**
 * Ranks the signed-in user against their accepted friends by lifetime XP.
 * Reads each profile with a single-document `get` (allowed by security rules).
 */
export async function getFriendsLeaderboard(uid: string): Promise<FriendsLeaderboard> {
  const friendUids = await fetchFriendUids(uid);
  const uniqueIds = [...new Set([uid, ...friendUids])];

  const infos = await Promise.all(
    uniqueIds.map(async (id) => ({ id, info: await fetchUserInfo(id) })),
  );

  const entries: LeaderboardEntry[] = infos
    .filter((x): x is { id: string; info: UserInfoRead } => x.info != null)
    .map(({ id, info }) => ({
      rank: 0,
      userId: id,
      displayName: displayNameFromUserInfo(info),
      profilePicUrl: info.profilePicUrl ?? null,
      lifetimeXp: lifetimeXpFromUserInfo(info),
    }))
    .sort((a, b) => b.lifetimeXp - a.lifetimeXp || a.displayName.localeCompare(b.displayName));

  entries.forEach((entry, index) => {
    entry.rank = index + 1;
  });

  const userRank = entries.find((e) => e.userId === uid);

  return { entries, userRank };
}
