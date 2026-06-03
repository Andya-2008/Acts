import { useEffect, useMemo, useRef } from 'react';
import { AppState, Platform } from 'react-native';

import { syncActivityNotifications } from '@/features/notifications/syncActivityNotifications';
import { useTasksQuery } from '@/features/tasks/hooks/useTasksQueries';
import { useUserInfoQuery } from '@/features/user-profile/hooks/useUserInfoQuery';
import { mergeActsDefaults } from '@/shared/types/actsSettings';
import { useAuthStore } from '@/shared/stores/authStore';

/**
 * Fires local notifications for new acts + new social activity on app open and
 * foreground (throttled internally). Pairs with the in-app derived inbox.
 */
export function ActivityNotificationsSync() {
  const uid = useAuthStore((s) => s.user?.uid);
  const { data: tasks } = useTasksQuery(uid);
  const { data: userInfo } = useUserInfoQuery(uid);
  const busy = useRef(false);

  const settings = useMemo(() => mergeActsDefaults(userInfo?.ActsSettings), [userInfo?.ActsSettings]);

  useEffect(() => {
    if (Platform.OS === 'web' || !uid) {
      return;
    }
    const run = () => {
      if (busy.current) {
        return;
      }
      busy.current = true;
      void syncActivityNotifications({ uid, tasks, settings }).finally(() => {
        busy.current = false;
      });
    };

    run();
    const sub = AppState.addEventListener('change', (s) => {
      if (s === 'active') {
        run();
      }
    });
    return () => sub.remove();
  }, [uid, tasks, settings]);

  return null;
}
