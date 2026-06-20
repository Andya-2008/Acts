/** Stable identifiers for scheduled local notifications (cancel + reschedule). */
export const LOCAL_NOTIFICATION_IDS = {
  dailyReminder: 'acts-retention-daily',
  incompleteNudge: 'acts-retention-incomplete',
  streakEvening: 'acts-retention-streak',
  weeklyRecap: 'acts-retention-weekly',
  weekendDouble: 'acts-retention-weekend',
  weeklyActMonday: 'acts-retention-weekly-act',
  monthlyAct: 'acts-retention-monthly',
  seasonStart: 'acts-retention-season-start',
  seasonEndingSoon: 'acts-retention-season-ending',
  seasonMilestone: 'acts-retention-season-milestone',
  leaderboardRankUp: 'acts-retention-leaderboard-rank',
  leaderboardWeekly: 'acts-retention-leaderboard-weekly',
  winBack: 'acts-retention-win-back',
} as const;

/** Activity (social + new acts) local notification identifiers. */
export const ACTIVITY_NOTIFICATION_IDS = {
  newTasks: 'acts-activity-new-tasks',
  socialActivity: 'acts-activity-social',
} as const;

export const ANDROID_CHANNEL_RETENTION = 'acts-retention';
export const ANDROID_CHANNEL_ACTIVITY = 'acts-activity';
