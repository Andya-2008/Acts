import { useNotificationNavigation } from '@/features/notifications/useNotificationNavigation';

/** Wires notification tap → Tasks tab (mounted under signed-in app shell). */
export function NotificationNavigationSync() {
  useNotificationNavigation();
  return null;
}
