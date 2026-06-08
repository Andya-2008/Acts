export type WidgetTaskItem = {
  id: string;
  title: string;
};

/** JSON payload shared between the app and home screen widgets. */
export type WidgetSnapshot = {
  streak: number;
  completedToday: boolean;
  openTaskCount: number;
  tasks: WidgetTaskItem[];
  updatedAt: string;
};

export const WIDGET_SNAPSHOT_STORAGE_KEY = '@acts/widget_snapshot_v1';
export const WIDGET_IOS_DATA_KEY = 'ActsWidgetData';
export const WIDGET_IOS_APP_GROUP = 'group.com.FrogCOO.Acts.expowidgets';
export const ANDROID_WIDGET_STREAK = 'ActsStreakWidget';
export const ANDROID_WIDGET_TASKS = 'ActsTasksWidget';
export const WIDGET_TASKS_DEEP_LINK = 'acts:///(app)/(tabs)/tasks';
