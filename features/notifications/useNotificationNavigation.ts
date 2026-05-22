import * as Notifications from 'expo-notifications';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { Platform } from 'react-native';

/**
 * Opens Tasks when the user taps a local reminder notification.
 */
export function useNotificationNavigation(): void {
  const router = useRouter();

  useEffect(() => {
    if (Platform.OS === 'web') {
      return;
    }

    const openTasks = () => {
      router.push('/(app)/(tabs)/tasks');
    };

    const last = Notifications.getLastNotificationResponse();
    if (last?.actionIdentifier === Notifications.DEFAULT_ACTION_IDENTIFIER) {
      openTasks();
    }

    const sub = Notifications.addNotificationResponseReceivedListener((response) => {
      if (response.actionIdentifier === Notifications.DEFAULT_ACTION_IDENTIFIER) {
        openTasks();
      }
    });

    return () => sub.remove();
  }, [router]);
}
