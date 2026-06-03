import * as Notifications from 'expo-notifications';
import { useRouter, type Href } from 'expo-router';
import { useEffect } from 'react';
import { Platform } from 'react-native';

function routeForScreen(screen: string | undefined): Href {
  switch (screen) {
    case 'notifications':
      return '/(app)/notifications' as Href;
    case 'deed-feed':
      return '/(app)/(tabs)/deed-feed' as Href;
    case 'tasks':
    default:
      return '/(app)/(tabs)/tasks' as Href;
  }
}

/**
 * Opens the relevant screen when the user taps a local notification, based on the
 * `data.screen` payload (defaults to Tasks for legacy reminders).
 */
export function useNotificationNavigation(): void {
  const router = useRouter();

  useEffect(() => {
    if (Platform.OS === 'web') {
      return;
    }

    const open = (response: Notifications.NotificationResponse | null) => {
      if (!response || response.actionIdentifier !== Notifications.DEFAULT_ACTION_IDENTIFIER) {
        return;
      }
      const screen = response.notification.request.content.data?.screen as string | undefined;
      router.push(routeForScreen(screen));
    };

    open(Notifications.getLastNotificationResponse());

    const sub = Notifications.addNotificationResponseReceivedListener((response) => open(response));

    return () => sub.remove();
  }, [router]);
}
