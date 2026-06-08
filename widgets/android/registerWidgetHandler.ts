import { Platform } from 'react-native';
import { registerWidgetTaskHandler } from 'react-native-android-widget';

import { loadWidgetSnapshot } from '@/features/widgets/widgetSnapshotStorage';
import {
  ANDROID_WIDGET_STREAK,
  ANDROID_WIDGET_TASKS,
} from '@/shared/types/widgetSnapshot';
import {
  EMPTY_WIDGET_SNAPSHOT,
  renderAndroidStreakWidget,
  renderAndroidTasksWidget,
} from '@/widgets/android/renderActsWidget';

if (Platform.OS === 'android') {
  registerWidgetTaskHandler(async ({ widgetInfo, widgetAction, renderWidget }) => {
    if (widgetAction === 'WIDGET_DELETED') {
      return;
    }

    const snapshot = (await loadWidgetSnapshot()) ?? EMPTY_WIDGET_SNAPSHOT;

    if (widgetInfo.widgetName === ANDROID_WIDGET_STREAK) {
      renderWidget(renderAndroidStreakWidget(snapshot));
      return;
    }

    if (widgetInfo.widgetName === ANDROID_WIDGET_TASKS) {
      renderWidget(renderAndroidTasksWidget(snapshot));
    }
  });
}
