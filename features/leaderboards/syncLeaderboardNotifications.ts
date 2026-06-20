import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import {
  getLeaderboardLastRank,
  getLeaderboardWeekSnapshot,
  isoWeekKey,
  setLeaderboardLastRank,
  setLeaderboardPreviousWeekSnapshot,
  setLeaderboardWeekSnapshot,
  type LeaderboardWeekSnapshot,
} from '@/features/leaderboards/leaderboardLocalState';
import type { FriendsLeaderboard } from '@/features/leaderboards/leaderboardRepository';
import { ensureNotificationHandler } from '@/features/notifications/notificationHandler';
import {
  ANDROID_CHANNEL_RETENTION,
  LOCAL_NOTIFICATION_IDS as ID,
} from '@/features/notifications/notificationIds';
import type { ActsAppSettings } from '@/shared/types/actsSettings';

async function hasPermission(): Promise<boolean> {
  const perm = await Notifications.getPermissionsAsync();
  return perm.status === 'granted';
}

async function safeCancel(id: string): Promise<void> {
  try {
    await Notifications.cancelScheduledNotificationAsync(id);
  } catch {
    // not scheduled
  }
}

function rankUpMessage(rank: number, total: number, spots: number): { title: string; body: string } {
  const spotWord = spots === 1 ? 'spot' : 'spots';
  if (rank === 1) {
    return {
      title: "You're #1 among friends",
      body: `You moved up ${spots} ${spotWord} and took the lead on the friends leaderboard.`,
    };
  }
  return {
    title: `You moved up to #${rank}`,
    body: `You climbed ${spots} ${spotWord} — now #${rank} of ${total} friends by lifetime XP.`,
  };
}

function weeklySummaryMessage(rank: number, total: number, lifetimeXp: number): { title: string; body: string } {
  return {
    title: 'Your week on the friends board',
    body: `You finished at #${rank} of ${total} friends with ${lifetimeXp.toLocaleString()} lifetime XP. Open Acts to see who moved.`,
  };
}

async function fireImmediateNotification(
  identifier: string,
  title: string,
  body: string,
): Promise<void> {
  const channel = Platform.OS === 'android' ? { channelId: ANDROID_CHANNEL_RETENTION } : {};
  await Notifications.scheduleNotificationAsync({
    identifier,
    content: {
      title,
      body,
      data: { screen: 'leaderboards' },
    },
    trigger: null,
    ...channel,
  });
}

export type LeaderboardNotificationInput = {
  uid: string;
  leaderboard: FriendsLeaderboard;
  settings: ActsAppSettings;
};

/**
 * Detects friends-leaderboard rank improvements and refreshes the Sunday standings reminder.
 */
export async function syncLeaderboardNotifications(input: LeaderboardNotificationInput): Promise<void> {
  if (Platform.OS === 'web') {
    return;
  }

  const { uid, leaderboard, settings } = input;
  const enabled = settings.notifyLeaderboardUpdates !== false;
  const userRank = leaderboard.userRank;
  const total = leaderboard.entries.length;

  await safeCancel(ID.leaderboardWeekly);

  if (!enabled || !userRank || total <= 1) {
    if (userRank) {
      await setLeaderboardLastRank(uid, userRank.rank);
    }
    return;
  }

  ensureNotificationHandler();

  const prevRank = await getLeaderboardLastRank(uid);
  const newRank = userRank.rank;

  if (prevRank != null && newRank < prevRank && (await hasPermission())) {
    const spots = prevRank - newRank;
    const { title, body } = rankUpMessage(newRank, total, spots);
    await fireImmediateNotification(`${ID.leaderboardRankUp}:${newRank}`, title, body);
  }

  await setLeaderboardLastRank(uid, newRank);

  const weekKey = isoWeekKey();
  const prevWeek = await getLeaderboardWeekSnapshot(uid);
  if (prevWeek && prevWeek.weekKey !== weekKey) {
    await setLeaderboardPreviousWeekSnapshot(uid, prevWeek);
  }
  if (!prevWeek || prevWeek.weekKey !== weekKey || prevWeek.rank !== newRank || prevWeek.lifetimeXp !== userRank.lifetimeXp) {
    await setLeaderboardWeekSnapshot(uid, { weekKey, rank: newRank, total, lifetimeXp: userRank.lifetimeXp });
  }

  if (!(await hasPermission())) {
    return;
  }

  const { title, body } = weeklySummaryMessage(newRank, total, userRank.lifetimeXp);
  const channel = Platform.OS === 'android' ? { channelId: ANDROID_CHANNEL_RETENTION } : {};
  await Notifications.scheduleNotificationAsync({
    identifier: ID.leaderboardWeekly,
    content: {
      title,
      body,
      data: { screen: 'leaderboards' },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
      weekday: 1,
      hour: 18,
      minute: 30,
      ...channel,
    },
  });
}

/** Rank delta since the user last opened the leaderboard screen (positive = moved up). */
export function rankDeltaSinceLastSeen(
  lastSeenRank: number | null,
  currentRank: number,
): number | null {
  if (lastSeenRank == null || lastSeenRank === currentRank) {
    return null;
  }
  return lastSeenRank - currentRank;
}

/** Rank delta vs the prior ISO week snapshot (positive = improved). */
export function rankDeltaSinceWeekSnapshot(
  snapshot: LeaderboardWeekSnapshot | null,
  currentRank: number,
): number | null {
  if (!snapshot) {
    return null;
  }
  if (snapshot.rank === currentRank) {
    return null;
  }
  return snapshot.rank - currentRank;
}
