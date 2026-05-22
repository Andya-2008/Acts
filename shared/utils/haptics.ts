import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';

/** Short success feedback when an act is marked done (no-op on web / if unavailable). */
export function celebrateTaskComplete(): void {
  if (Platform.OS === 'web') {
    return;
  }
  try {
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  } catch {
    /* optional native module */
  }
}

/** Light tap when unchecking (optional polish). */
export function taskUncheckedHaptic(): void {
  if (Platform.OS === 'web') {
    return;
  }
  try {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  } catch {
    /* optional */
  }
}
