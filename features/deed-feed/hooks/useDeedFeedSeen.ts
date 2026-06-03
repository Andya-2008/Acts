import { useCallback, useEffect, useRef, useState } from 'react';

import {
  addSeenPostIds,
  clearSeenPostIds,
  loadSeenPostIds,
} from '@/features/deed-feed/deedFeedSeenStorage';

/**
 * Loads a one-time snapshot of "already seen" post ids for filtering this session,
 * while still recording newly-viewed posts so they're hidden on the next visit.
 *
 * The snapshot is intentionally frozen at mount: posts the user scrolls past stay
 * visible until they leave and come back, instead of vanishing mid-scroll.
 */
export function useDeedFeedSeen(uid: string | undefined) {
  const [seenSnapshot, setSeenSnapshot] = useState<Set<string>>(() => new Set());
  const [ready, setReady] = useState(false);
  /** Ids recorded as seen during this session (persisted, not added to the snapshot). */
  const pendingRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    let cancelled = false;
    if (!uid) {
      setSeenSnapshot(new Set());
      setReady(true);
      return;
    }
    setReady(false);
    void (async () => {
      const ids = await loadSeenPostIds(uid);
      if (cancelled) {
        return;
      }
      setSeenSnapshot(ids);
      setReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [uid]);

  const markSeen = useCallback(
    (ids: string[]) => {
      if (!uid || ids.length === 0) {
        return;
      }
      const fresh = ids.filter((id) => id && !pendingRef.current.has(id));
      if (fresh.length === 0) {
        return;
      }
      for (const id of fresh) {
        pendingRef.current.add(id);
      }
      void addSeenPostIds(uid, fresh);
    },
    [uid],
  );

  const resetSeen = useCallback(async () => {
    if (!uid) {
      return;
    }
    pendingRef.current = new Set();
    await clearSeenPostIds(uid);
    setSeenSnapshot(new Set());
  }, [uid]);

  return { seenSnapshot, ready, markSeen, resetSeen };
}
