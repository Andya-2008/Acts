import * as Notifications from 'expo-notifications';
import { useEffect } from 'react';
import { Platform } from 'react-native';

import { useNotificationsUnreadCount } from '@/features/notifications/hooks/useDerivedNotifications';
import { useAuthStore } from '@/shared/stores/authStore';

/** Keeps the native app icon badge aligned with the derived inbox unread count. */
export function NotificationBadgeSync() {
  const uid = useAuthStore((s) => s.user?.uid);
  const unread = useNotificationsUnreadCount(uid);

  useEffect(() => {
    if (Platform.OS === 'web' || !uid) {
      return;
    }
    void Notifications.setBadgeCountAsync(unread).catch(() => {
      // Permission denied or unsupported — ignore.
    });
  }, [uid, unread]);

  return null;
}
