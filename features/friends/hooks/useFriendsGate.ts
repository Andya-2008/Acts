import { useEffect, useState } from 'react';

import { isPostSignupFriendsGateRequired } from '@/features/friends/friendsGetStartedStorage';
import { useFriendUidsQuery } from '@/features/friends/hooks/useFriendsQueries';
import { useFriendsGateRefreshStore } from '@/shared/stores/friendsGateRefreshStore';

/**
 * Post-signup friends gate - only required after creating an account, not on normal app open / login.
 */
export function useFriendsGate(uid: string | undefined) {
  const friendsQuery = useFriendUidsQuery(uid);
  const gateGeneration = useFriendsGateRefreshStore((s) => s.generation);
  const [ready, setReady] = useState(false);
  const [required, setRequired] = useState(false);

  useEffect(() => {
    if (!uid) {
      setReady(false);
      setRequired(false);
      return;
    }
    if (!friendsQuery.isFetched) {
      setReady(false);
      return;
    }
    // Re-checking (e.g. after a skip/continue bump): hold `ready` false so the
    // guard shows a loader instead of redirecting with a stale `required=true`.
    // That stale redirect would mount-then-unmount the tabs and orphan the
    // first-run tutorial modal, freezing the app.
    setReady(false);
    let cancelled = false;
    void (async () => {
      const needsGate = await isPostSignupFriendsGateRequired(uid, friendsQuery.data?.length ?? 0);
      if (cancelled) {
        return;
      }
      setRequired(needsGate);
      setReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [uid, friendsQuery.isFetched, friendsQuery.data?.length, gateGeneration]);

  return {
    ready,
    required: ready && required,
    refetchFriends: friendsQuery.refetch,
  };
}
