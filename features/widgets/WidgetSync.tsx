import { useEffect, useMemo, useRef } from 'react';
import { AppState, Platform } from 'react-native';

import { buildWidgetSnapshot } from '@/features/widgets/buildWidgetSnapshot';
import { clearWidgets, syncWidgets } from '@/features/widgets/syncWidgets';
import { useTasksQuery } from '@/features/tasks/hooks/useTasksQueries';
import { useUserInfoQuery } from '@/features/user-profile/hooks/useUserInfoQuery';
import { mergeActsDefaults } from '@/shared/types/actsSettings';
import { useAuthStore } from '@/shared/stores/authStore';

/** Keeps home screen widgets aligned with streak + open acts. */
export function WidgetSync() {
  const uid = useAuthStore((s) => s.user?.uid);
  const { data: tasks } = useTasksQuery(uid);
  const { data: userInfo } = useUserInfoQuery(uid);
  const busy = useRef(false);

  const grace = useMemo(() => {
    const acts = mergeActsDefaults(userInfo?.ActsSettings);
    return {
      streakGraceForgivenDayKey: acts.streakGraceForgivenDayKey,
      streakGraceAppliedInMonth: acts.streakGraceAppliedInMonth,
      streakGraceAdForgivenDayKey: acts.streakGraceAdForgivenDayKey,
      streakGraceAdAppliedInMonth: acts.streakGraceAdAppliedInMonth,
    };
  }, [userInfo?.ActsSettings]);

  useEffect(() => {
    if (Platform.OS === 'web') {
      return;
    }
    const run = () => {
      if (busy.current) {
        return;
      }
      busy.current = true;
      const finish = () => {
        busy.current = false;
      };
      if (!uid) {
        void clearWidgets().finally(finish);
        return;
      }
      const snapshot = buildWidgetSnapshot(tasks, grace);
      void syncWidgets(snapshot).finally(finish);
    };

    run();
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        run();
      }
    });
    return () => sub.remove();
  }, [uid, tasks, grace]);

  return null;
}
