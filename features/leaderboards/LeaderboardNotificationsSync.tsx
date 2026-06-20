import { useEffect, useMemo, useRef } from 'react';
import { AppState, Platform } from 'react-native';

import { useFriendsLeaderboardQuery } from '@/features/leaderboards/hooks/useLeaderboardQueries';
import { syncLeaderboardNotifications } from '@/features/leaderboards/syncLeaderboardNotifications';
import { useUserInfoQuery } from '@/features/user-profile/hooks/useUserInfoQuery';
import { mergeActsDefaults } from '@/shared/types/actsSettings';
import { useAuthStore } from '@/shared/stores/authStore';

/** Rank-change pushes and Sunday friends-leaderboard summaries. */
export function LeaderboardNotificationsSync() {
  const uid = useAuthStore((s) => s.user?.uid);
  const { data: leaderboard } = useFriendsLeaderboardQuery(uid);
  const { data: userInfo } = useUserInfoQuery(uid);
  const settings = useMemo(() => mergeActsDefaults(userInfo?.ActsSettings), [userInfo?.ActsSettings]);
  const busy = useRef(false);
  const lifetimeXp = userInfo?.LifetimeXP;

  useEffect(() => {
    if (Platform.OS === 'web' || !uid || !leaderboard?.userRank) {
      return;
    }

    const run = () => {
      if (busy.current) {
        return;
      }
      busy.current = true;
      void syncLeaderboardNotifications({ uid, leaderboard, settings }).finally(() => {
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
  }, [uid, leaderboard, settings, lifetimeXp]);

  return null;
}
