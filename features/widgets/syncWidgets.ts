import { Platform } from 'react-native';

import { saveWidgetSnapshot } from '@/features/widgets/widgetSnapshotStorage';
import type { WidgetSnapshot } from '@/shared/types/widgetSnapshot';
import {
  ANDROID_WIDGET_STREAK,
  ANDROID_WIDGET_TASKS,
} from '@/shared/types/widgetSnapshot';

const emptySnapshot = (): WidgetSnapshot => ({
  streak: 0,
  completedToday: false,
  openTaskCount: 0,
  tasks: [],
  updatedAt: new Date().toISOString(),
});

async function syncIosWidget(snapshot: WidgetSnapshot): Promise<void> {
  if (Platform.OS !== 'ios') {
    return;
  }
  try {
    const { setWidgetData } = await import('@bittingz/expo-widgets');
    setWidgetData(JSON.stringify(snapshot));
  } catch {
    // Native module unavailable in Expo Go / web.
  }
}

async function syncAndroidWidgets(snapshot: WidgetSnapshot): Promise<void> {
  if (Platform.OS !== 'android') {
    return;
  }
  try {
    const { requestWidgetUpdate } = await import('react-native-android-widget');
    const { renderAndroidStreakWidget, renderAndroidTasksWidget } = await import(
      '@/widgets/android/renderActsWidget'
    );

    await requestWidgetUpdate({
      widgetName: ANDROID_WIDGET_STREAK,
      renderWidget: () => renderAndroidStreakWidget(snapshot),
    });
    await requestWidgetUpdate({
      widgetName: ANDROID_WIDGET_TASKS,
      renderWidget: () => renderAndroidTasksWidget(snapshot),
    });
  } catch {
    // Native module unavailable outside dev/production builds.
  }
}

export async function syncWidgets(snapshot: WidgetSnapshot | null | undefined): Promise<void> {
  if (Platform.OS === 'web') {
    return;
  }
  const payload = snapshot ?? emptySnapshot();
  await saveWidgetSnapshot(payload);
  await Promise.all([syncIosWidget(payload), syncAndroidWidgets(payload)]);
}

export async function clearWidgets(): Promise<void> {
  await syncWidgets(emptySnapshot());
}
