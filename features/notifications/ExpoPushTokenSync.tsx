import { useEffect, useMemo } from 'react';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';

import { ensureNotificationHandler } from '@/features/notifications/notificationHandler';
import { registerExpoPushToken } from '@/features/notifications/registerExpoPushToken';
import { wantsSocialPush } from '@/features/notifications/socialPushSettings';
import { useUserInfoQuery } from '@/features/user-profile/hooks/useUserInfoQuery';
import { mergeActsDefaults } from '@/shared/types/actsSettings';
import { useAuthStore } from '@/shared/stores/authStore';

/**
 * Registers the Expo push token for social alerts whenever the user has social
 * notifications enabled — independent of retention local reminders.
 */
export function ExpoPushTokenSync() {
  const uid = useAuthStore((s) => s.user?.uid);
  const { data: userInfo } = useUserInfoQuery(uid);
  const settings = useMemo(() => mergeActsDefaults(userInfo?.ActsSettings), [userInfo?.ActsSettings]);

  useEffect(() => {
    if (Platform.OS === 'web' || !uid) {
      return;
    }

    ensureNotificationHandler();

    if (!wantsSocialPush(settings)) {
      return;
    }

    void (async () => {
      const perm = await Notifications.getPermissionsAsync();
      let granted = perm.status === 'granted';
      if (!granted && perm.canAskAgain) {
        const req = await Notifications.requestPermissionsAsync();
        granted = req.status === 'granted';
      }
      if (granted) {
        await registerExpoPushToken(uid);
      }
    })();
  }, [uid, settings]);

  return null;
}
