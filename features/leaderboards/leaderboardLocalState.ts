import AsyncStorage from '@react-native-async-storage/async-storage';

const lastRankKey = (uid: string) => `@acts/leaderboard_last_rank_${uid}`;
const lastSeenRankKey = (uid: string) => `@acts/leaderboard_seen_rank_${uid}`;
const weekSnapshotKey = (uid: string) => `@acts/leaderboard_week_${uid}`;
const prevWeekSnapshotKey = (uid: string) => `@acts/leaderboard_prev_week_${uid}`;

export type LeaderboardWeekSnapshot = {
  weekKey: string;
  rank: number;
  total: number;
  lifetimeXp: number;
};

/** ISO week key (Monday-based) e.g. `2026-W24`. */
export function isoWeekKey(d = new Date()): string {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const day = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((date.getTime() - yearStart.getTime()) / 86_400_000 + 1) / 7);
  return `${date.getUTCFullYear()}-W${String(week).padStart(2, '0')}`;
}

export async function getLeaderboardLastRank(uid: string): Promise<number | null> {
  try {
    const raw = await AsyncStorage.getItem(lastRankKey(uid));
    if (raw == null) {
      return null;
    }
    const n = Number(raw);
    return Number.isFinite(n) && n > 0 ? Math.floor(n) : null;
  } catch {
    return null;
  }
}

export async function setLeaderboardLastRank(uid: string, rank: number): Promise<void> {
  try {
    await AsyncStorage.setItem(lastRankKey(uid), String(Math.max(1, Math.floor(rank))));
  } catch {
    // ignore
  }
}

export async function getLeaderboardLastSeenRank(uid: string): Promise<number | null> {
  try {
    const raw = await AsyncStorage.getItem(lastSeenRankKey(uid));
    if (raw == null) {
      return null;
    }
    const n = Number(raw);
    return Number.isFinite(n) && n > 0 ? Math.floor(n) : null;
  } catch {
    return null;
  }
}

export async function setLeaderboardLastSeenRank(uid: string, rank: number): Promise<void> {
  try {
    await AsyncStorage.setItem(lastSeenRankKey(uid), String(Math.max(1, Math.floor(rank))));
  } catch {
    // ignore
  }
}

export async function getLeaderboardWeekSnapshot(uid: string): Promise<LeaderboardWeekSnapshot | null> {
  try {
    const raw = await AsyncStorage.getItem(weekSnapshotKey(uid));
    if (!raw) {
      return null;
    }
    const parsed = JSON.parse(raw) as LeaderboardWeekSnapshot;
    if (!parsed?.weekKey || typeof parsed.rank !== 'number') {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export async function setLeaderboardWeekSnapshot(uid: string, snapshot: LeaderboardWeekSnapshot): Promise<void> {
  try {
    await AsyncStorage.setItem(weekSnapshotKey(uid), JSON.stringify(snapshot));
  } catch {
    // ignore
  }
}

export async function getLeaderboardPreviousWeekSnapshot(uid: string): Promise<LeaderboardWeekSnapshot | null> {
  try {
    const raw = await AsyncStorage.getItem(prevWeekSnapshotKey(uid));
    if (!raw) {
      return null;
    }
    const parsed = JSON.parse(raw) as LeaderboardWeekSnapshot;
    if (!parsed?.weekKey || typeof parsed.rank !== 'number') {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export async function setLeaderboardPreviousWeekSnapshot(
  uid: string,
  snapshot: LeaderboardWeekSnapshot,
): Promise<void> {
  try {
    await AsyncStorage.setItem(prevWeekSnapshotKey(uid), JSON.stringify(snapshot));
  } catch {
    // ignore
  }
}
