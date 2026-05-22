import { useEffect, useMemo, useRef } from 'react';
import { AppState, Platform } from 'react-native';

import { syncRetentionLocalNotifications } from '@/features/retention/syncRetentionLocalNotifications';
import { useTasksQuery } from '@/features/tasks/hooks/useTasksQueries';
import { useUserInfoQuery } from '@/features/user-profile/hooks/useUserInfoQuery';
import { mergeActsDefaults } from '@/shared/types/actsSettings';
import { useAuthStore } from '@/shared/stores/authStore';

/**
 * Keeps local retention notifications aligned with tasks + settings (foreground refresh).
 */
export function RetentionNotificationsSync() {
  const uid = useAuthStore((s) => s.user?.uid);
  const { data: tasks } = useTasksQuery(uid);
  const { data: userInfo } = useUserInfoQuery(uid);
  const busy = useRef(false);

  const acts = useMemo(() => mergeActsDefaults(userInfo?.ActsSettings), [userInfo?.ActsSettings]);
  const grace = useMemo(
    () => ({
      streakGraceForgivenDayKey: acts.streakGraceForgivenDayKey,
      streakGraceAppliedInMonth: acts.streakGraceAppliedInMonth,
    }),
    [acts.streakGraceForgivenDayKey, acts.streakGraceAppliedInMonth],
  );

  useEffect(() => {
    if (Platform.OS === 'web') {
      return;
    }
    const run = () => {
      if (busy.current) {
        return;
      }
      busy.current = true;
      void syncRetentionLocalNotifications({
        uid,
        tasks,
        settings: acts,
        grace,
      }).finally(() => {
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
  }, [uid, tasks, acts, grace]);

  return null;
}
