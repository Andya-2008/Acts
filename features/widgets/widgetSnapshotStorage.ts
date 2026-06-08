import AsyncStorage from '@react-native-async-storage/async-storage';

import type { WidgetSnapshot } from '@/shared/types/widgetSnapshot';
import { WIDGET_SNAPSHOT_STORAGE_KEY } from '@/shared/types/widgetSnapshot';

export async function loadWidgetSnapshot(): Promise<WidgetSnapshot | null> {
  try {
    const raw = await AsyncStorage.getItem(WIDGET_SNAPSHOT_STORAGE_KEY);
    if (!raw) {
      return null;
    }
    return JSON.parse(raw) as WidgetSnapshot;
  } catch {
    return null;
  }
}

export async function saveWidgetSnapshot(snapshot: WidgetSnapshot): Promise<void> {
  await AsyncStorage.setItem(WIDGET_SNAPSHOT_STORAGE_KEY, JSON.stringify(snapshot));
}
