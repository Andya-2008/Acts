import { useEffect, useMemo, useRef } from 'react';
import { AppState, Platform } from 'react-native';

import { getActiveSeason } from '@/features/challenges/data/seasons';
import { useSeasonProgressQuery } from '@/features/challenges/hooks/useSeasonalChallengeQueries';
import { syncSeasonChallengeNotifications } from '@/features/challenges/seasonChallengeNotifications';
import { useUserInfoQuery } from '@/features/user-profile/hooks/useUserInfoQuery';
import { mergeActsDefaults } from '@/shared/types/actsSettings';
import { useAuthStore } from '@/shared/stores/authStore';

/** Keeps seasonal start / ending-soon local notifications aligned with progress. */
export function SeasonNotificationsSync() {
  const uid = useAuthStore((s) => s.user?.uid);
  const season = useMemo(() => getActiveSeason(), []);
  const { data: progress } = useSeasonProgressQuery(uid, season.id);
  const { data: userInfo } = useUserInfoQuery(uid);
  const settings = useMemo(() => mergeActsDefaults(userInfo?.ActsSettings), [userInfo?.ActsSettings]);
  const busy = useRef(false);

  useEffect(() => {
    if (Platform.OS === 'web' || !uid) {
      return;
    }

    const run = () => {
      if (busy.current) {
        return;
      }
      busy.current = true;
      void syncSeasonChallengeNotifications({ uid, progress, settings }).finally(() => {
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
  }, [uid, progress, settings]);

  return null;
}
