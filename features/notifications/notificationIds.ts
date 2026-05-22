/** Stable identifiers for scheduled local notifications (cancel + reschedule). */
export const LOCAL_NOTIFICATION_IDS = {
  dailyReminder: 'acts-retention-daily',
  incompleteNudge: 'acts-retention-incomplete',
  streakEvening: 'acts-retention-streak',
  weeklyRecap: 'acts-retention-weekly',
  weekendDouble: 'acts-retention-weekend',
  weeklyActMonday: 'acts-retention-weekly-act',
  monthlyAct: 'acts-retention-monthly',
} as const;

export const ANDROID_CHANNEL_RETENTION = 'acts-retention';
