import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { getActiveSeason, seasonDaysRemaining, type SeasonalSeason } from '@/features/challenges/data/seasons';
import {
  milestoneMessage,
  milestoneTitle,
  totalSeasonLogs,
  type SeasonMilestone,
} from '@/features/challenges/seasonMilestones';
import type { SeasonProgress } from '@/features/challenges/seasonalChallengeRepository';
import { ensureNotificationHandler } from '@/features/notifications/notificationHandler';
import {
  ANDROID_CHANNEL_RETENTION,
  LOCAL_NOTIFICATION_IDS as ID,
} from '@/features/notifications/notificationIds';
import type { ActsAppSettings } from '@/shared/types/actsSettings';

const milestoneKey = (uid: string, seasonId: string) => `@acts/season_milestone_${uid}_${seasonId}`;
const seasonStartKey = (uid: string, seasonId: string) => `@acts/season_start_${uid}_${seasonId}`;

async function getFlag(key: string): Promise<boolean> {
  try {
    return (await AsyncStorage.getItem(key)) === '1';
  } catch {
    return false;
  }
}

async function setFlag(key: string): Promise<void> {
  try {
    await AsyncStorage.setItem(key, '1');
  } catch {
    // ignore
  }
}

async function getStoredMilestoneToken(uid: string, seasonId: string): Promise<string> {
  try {
    return (await AsyncStorage.getItem(milestoneKey(uid, seasonId))) ?? '';
  } catch {
    return '';
  }
}

async function setStoredMilestoneToken(uid: string, seasonId: string, token: string): Promise<void> {
  try {
    await AsyncStorage.setItem(milestoneKey(uid, seasonId), token);
  } catch {
    // ignore
  }
}

function milestoneToken(milestone: SeasonMilestone): string {
  return `${milestone.kind}:${milestone.value}`;
}

async function hasPermission(): Promise<boolean> {
  const perm = await Notifications.getPermissionsAsync();
  return perm.status === 'granted';
}

function nextMonthFirst(hour: number, minute: number): Date {
  const d = new Date();
  d.setDate(1);
  d.setHours(hour, minute, 0, 0);
  d.setSeconds(0, 0);
  d.setMilliseconds(0);
  if (d.getTime() <= Date.now()) {
    d.setMonth(d.getMonth() + 1);
    d.setDate(1);
  }
  return d;
}

function seasonEndingSoonDate(season: SeasonalSeason): Date | null {
  const warn = new Date(season.endDate);
  warn.setDate(warn.getDate() - 3);
  warn.setHours(18, 0, 0, 0);
  warn.setSeconds(0, 0);
  warn.setMilliseconds(0);
  if (warn.getTime() <= Date.now()) {
    return null;
  }
  return warn;
}

async function safeCancel(id: string): Promise<void> {
  try {
    await Notifications.cancelScheduledNotificationAsync(id);
  } catch {
    // not scheduled
  }
}

export type SeasonNotificationInput = {
  uid: string | undefined;
  progress: SeasonProgress | null | undefined;
  settings: ActsAppSettings;
};

/**
 * Schedules season-start and season-ending-soon local reminders.
 * Milestone pushes fire immediately from challenge completion (see `maybeFireSeasonMilestoneNotification`).
 */
export async function syncSeasonChallengeNotifications(input: SeasonNotificationInput): Promise<void> {
  if (Platform.OS === 'web') {
    return;
  }

  const { uid, progress, settings } = input;
  await safeCancel(ID.seasonStart);
  await safeCancel(ID.seasonEndingSoon);

  if (!uid || settings.notifySeasonChallenges === false) {
    return;
  }

  ensureNotificationHandler();
  if (!(await hasPermission())) {
    return;
  }

  const season = getActiveSeason();
  const channel = Platform.OS === 'android' ? { channelId: ANDROID_CHANNEL_RETENTION } : {};
  const logs = totalSeasonLogs(progress?.completions ?? {});

  if (logs < 1) {
    const dayOfMonth = new Date().getDate();
    const startKey = seasonStartKey(uid, season.id);
    if (dayOfMonth <= 3 && !(await getFlag(startKey))) {
      await Notifications.scheduleNotificationAsync({
        identifier: `${ID.seasonStart}:immediate`,
        content: {
          title: `${season.name} is live`,
          body: 'Log kindness challenges this month for bonus XP — honor system, no proof required.',
          data: { screen: 'challenges' },
        },
        trigger: null,
        ...channel,
      });
      await setFlag(startKey);
    }
  }

  await Notifications.scheduleNotificationAsync({
    identifier: ID.seasonStart,
    content: {
      title: `${season.name} is live`,
      body: 'New seasonal kindness challenges are here — log real-world acts for bonus XP.',
      data: { screen: 'challenges' },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: nextMonthFirst(9, 0),
      ...channel,
    },
  });

  const endingDate = seasonEndingSoonDate(season);
  const daysLeft = seasonDaysRemaining(season);
  if (endingDate && daysLeft >= 3) {
    await Notifications.scheduleNotificationAsync({
      identifier: ID.seasonEndingSoon,
      content: {
        title: `3 days left in ${season.name}`,
        body: 'Log a kindness challenge before the month ends to earn bonus XP.',
        data: { screen: 'challenges' },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: endingDate,
        ...channel,
      },
    });
  }
}

/** Fires a one-time local push when a new XP or log milestone is reached. */
export async function maybeFireSeasonMilestoneNotification(
  uid: string,
  season: SeasonalSeason,
  milestone: SeasonMilestone,
): Promise<boolean> {
  if (Platform.OS === 'web') {
    return false;
  }

  const token = milestoneToken(milestone);
  const stored = await getStoredMilestoneToken(uid, season.id);
  if (stored === token) {
    return false;
  }

  ensureNotificationHandler();
  if (!(await hasPermission())) {
    return false;
  }

  const channel = Platform.OS === 'android' ? { channelId: ANDROID_CHANNEL_RETENTION } : {};
  await Notifications.scheduleNotificationAsync({
    identifier: `${ID.seasonMilestone}:${season.id}:${token}`,
    content: {
      title: `Milestone: ${milestoneTitle(milestone)}`,
      body: milestoneMessage(milestone, season.name),
      data: { screen: 'challenges', type: 'season_milestone' },
    },
    trigger: null,
    ...channel,
  });

  await setStoredMilestoneToken(uid, season.id, token);
  return true;
}
