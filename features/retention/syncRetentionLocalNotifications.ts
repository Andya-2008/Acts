import * as Notifications from 'expo-notifications';
import { SchedulableTriggerInputTypes } from 'expo-notifications';
import { Platform } from 'react-native';

import {
  ANDROID_CHANNEL_RETENTION,
  LOCAL_NOTIFICATION_IDS as ID,
} from '@/features/notifications/notificationIds';
import { registerExpoPushToken } from '@/features/notifications/registerExpoPushToken';
import {
  computeCompletionStreak,
  localDateKey,
  type StreakGraceSlice,
} from '@/features/user-profile/utils/computeCompletionStreak';
import type { ActsAppSettings } from '@/shared/types/actsSettings';
import type { ActTask } from '@/shared/types/task';

export { ID as RETENTION_NOTIFICATION_IDS };

let handlerInstalled = false;
let androidChannelReady = false;

function ensureNotificationHandler(): void {
  if (handlerInstalled) {
    return;
  }
  handlerInstalled = true;
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
}

async function ensureAndroidChannel(): Promise<void> {
  if (Platform.OS !== 'android' || androidChannelReady) {
    return;
  }
  await Notifications.setNotificationChannelAsync(ANDROID_CHANNEL_RETENTION, {
    name: 'Acts reminders',
    importance: Notifications.AndroidImportance.DEFAULT,
    description: 'Daily acts, streaks, and weekend bonuses',
  });
  androidChannelReady = true;
}

async function safeCancel(id: string): Promise<void> {
  try {
    await Notifications.cancelScheduledNotificationAsync(id);
  } catch {
    // not scheduled
  }
}

async function cancelAllRetention(): Promise<void> {
  await Promise.all(Object.values(ID).map((id) => safeCancel(id)));
}

function nextLocalWallClock(hour: number, minute: number): Date {
  const d = new Date();
  d.setSeconds(0, 0);
  d.setMilliseconds(0);
  d.setHours(hour, minute, 0, 0);
  if (d.getTime() <= Date.now()) {
    d.setDate(d.getDate() + 1);
  }
  return d;
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

function clampReminderHour(h: number | undefined): number {
  const n = typeof h === 'number' && Number.isFinite(h) ? Math.floor(h) : 18;
  return Math.min(21, Math.max(9, n));
}

function incompleteNudgeHour(dailyHour: number): number {
  return Math.min(21, Math.max(9, dailyHour + 3));
}

function completedOnLocalDay(tasks: ActTask[], dayKey: string): boolean {
  for (const t of tasks) {
    if (t.completedAt == null) {
      continue;
    }
    if (localDateKey(t.completedAt.toDate()) === dayKey) {
      return true;
    }
  }
  return false;
}

function hasIncompleteAssignedAct(tasks: ActTask[], todayKey: string): boolean {
  return tasks.some(
    (t) =>
      t.active &&
      t.completedAt == null &&
      (t.cadence === 'daily' ||
        (t.cadence === 'weekly' && t.assignedPeriodKey != null) ||
        (t.cadence === 'monthly' && t.assignedPeriodKey != null)),
  );
}

async function ensureNotificationPermission(): Promise<boolean> {
  const perm = await Notifications.getPermissionsAsync();
  let granted = perm.status === 'granted';
  if (!granted && perm.canAskAgain) {
    const req = await Notifications.requestPermissionsAsync();
    granted = req.status === 'granted';
  }
  return granted;
}

export type RetentionSyncInput = {
  uid: string | undefined;
  tasks: ActTask[] | undefined;
  settings: ActsAppSettings;
  grace?: StreakGraceSlice | null;
};

/**
 * Schedules / refreshes local notifications from Acts settings and task state.
 * Safe to call often (e.g. on foreground); cancels prior schedules first.
 */
export async function syncRetentionLocalNotifications(input: RetentionSyncInput): Promise<void> {
  if (Platform.OS === 'web') {
    return;
  }
  ensureNotificationHandler();
  await ensureAndroidChannel();

  const { uid, tasks, settings, grace } = input;
  await cancelAllRetention();

  if (!uid) {
    return;
  }

  const wantsLocal =
    settings.notifyDailyReminder ||
    settings.notifyIncompleteActWarning ||
    settings.notifyStreakWarning ||
    settings.notifyWeeklyRecap ||
    settings.notifyWeekendDoublePromo ||
    settings.notifyWeeklyActReminder ||
    settings.notifyMonthlyActReminder;

  if (!wantsLocal) {
    return;
  }

  const granted = await ensureNotificationPermission();
  if (!granted) {
    return;
  }

  void registerExpoPushToken(uid);

  const list = tasks ?? [];
  const todayKey = localDateKey(new Date());
  const doneToday = completedOnLocalDay(list, todayKey);
  const hasOpenActs = hasIncompleteAssignedAct(list, todayKey);
  const streakDays = computeCompletionStreak(list, grace ?? null);

  const channel = Platform.OS === 'android' ? { channelId: ANDROID_CHANNEL_RETENTION } : {};
  const dailyHour = clampReminderHour(settings.retentionDailyReminderHour);

  if (settings.notifyDailyReminder) {
    await Notifications.scheduleNotificationAsync({
      identifier: ID.dailyReminder,
      content: {
        title: 'Time for an act of kindness',
        body: doneToday
          ? 'You showed up today - open Acts for tomorrow’s ideas.'
          : 'Open Acts to see today’s suggested acts.',
        data: { screen: 'tasks' },
      },
      trigger: {
        type: SchedulableTriggerInputTypes.DAILY,
        hour: dailyHour,
        minute: 0,
        ...channel,
      },
    });
  }

  if (settings.notifyIncompleteActWarning && hasOpenActs) {
    const incHour = incompleteNudgeHour(dailyHour);
    await Notifications.scheduleNotificationAsync({
      identifier: ID.incompleteNudge,
      content: {
        title: 'Acts waiting for you',
        body: doneToday
          ? 'You completed something today - finish another act on your list if you can.'
          : 'You still have acts on your list. One quick completion counts.',
        data: { screen: 'tasks' },
      },
      trigger: {
        type: SchedulableTriggerInputTypes.DAILY,
        hour: incHour,
        minute: 0,
        ...channel,
      },
    });
  }

  if (settings.notifyWeeklyRecap) {
    await Notifications.scheduleNotificationAsync({
      identifier: ID.weeklyRecap,
      content: {
        title: 'Your week on Acts',
        body:
          streakDays >= 1
            ? `You’re on a ${streakDays}-day streak. Open Acts for a quick recap.`
            : 'Open Acts to see your streak and completed acts.',
        data: { screen: 'tasks' },
      },
      trigger: {
        type: SchedulableTriggerInputTypes.WEEKLY,
        weekday: 1,
        hour: 18,
        minute: 0,
        ...channel,
      },
    });
  }

  if (settings.notifyWeekendDoublePromo) {
    await Notifications.scheduleNotificationAsync({
      identifier: ID.weekendDouble,
      content: {
        title: 'Weekend double rewards',
        body: 'Friday-Sunday: earn double seeds and XP on completed acts. Open Acts to start.',
        data: { screen: 'tasks' },
      },
      trigger: {
        type: SchedulableTriggerInputTypes.WEEKLY,
        weekday: 6,
        hour: 10,
        minute: 0,
        ...channel,
      },
    });
  }

  if (settings.notifyWeeklyActReminder) {
    await Notifications.scheduleNotificationAsync({
      identifier: ID.weeklyActMonday,
      content: {
        title: 'New week, new acts',
        body: 'Your weekly acts are ready. Open Acts and pick one to complete with a friend.',
        data: { screen: 'tasks' },
      },
      trigger: {
        type: SchedulableTriggerInputTypes.WEEKLY,
        weekday: 2,
        hour: 9,
        minute: 0,
        ...channel,
      },
    });
  }

  if (settings.notifyMonthlyActReminder) {
    await Notifications.scheduleNotificationAsync({
      identifier: ID.monthlyAct,
      content: {
        title: 'Monthly act reminder',
        body: 'A bigger monthly act is on your list. Open Acts when you have time this month.',
        data: { screen: 'tasks' },
      },
      trigger: {
        type: SchedulableTriggerInputTypes.DATE,
        date: nextMonthFirst(10, 0),
        ...channel,
      },
    });
  }

  if (settings.notifyStreakWarning && streakDays >= 1 && !doneToday) {
    await Notifications.scheduleNotificationAsync({
      identifier: ID.streakEvening,
      content: {
        title: `Keep your ${streakDays}-day streak`,
        body: "You haven't completed an act yet today. A quick one counts.",
        data: { screen: 'tasks' },
      },
      trigger: {
        type: SchedulableTriggerInputTypes.DATE,
        date: nextLocalWallClock(20, 0),
        ...channel,
      },
    });
  }
}
