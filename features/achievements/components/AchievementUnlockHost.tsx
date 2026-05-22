import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import {
  ACHIEVEMENTS,
  computeUnlockedAchievementIds,
  type AchievementDef,
  type AchievementMetrics,
} from '@/features/achievements/achievementCatalog';
import { AchievementUnlockedOverlay } from '@/features/achievements/components/AchievementUnlockedOverlay';
import { appendAchievementSeen, ensureAchievementBootstrap } from '@/features/achievements/achievementSeenStorage';
import { useMyDeedPostsQuery } from '@/features/deed-feed/hooks/useDeedPostsQueries';
import { computeCompletionStreak } from '@/features/user-profile/utils/computeCompletionStreak';
import { useTasksQuery } from '@/features/tasks/hooks/useTasksQueries';
import { useUserInfoQuery } from '@/features/user-profile/hooks/useUserInfoQuery';
import { useAuthStore } from '@/shared/stores/authStore';
import { mergeActsDefaults } from '@/shared/types/actsSettings';

/**
 * Watches progress and shows full-screen unlock overlays (one at a time).
 * Mount once under the authenticated app shell (e.g. tabs layout).
 */
export function AchievementUnlockHost() {
  const uid = useAuthStore((s) => s.user?.uid);
  const { data: tasks, isPending: tasksPending } = useTasksQuery(uid);
  const { data: userInfo } = useUserInfoQuery(uid);
  const { data: myPosts, isPending: myPostsPending } = useMyDeedPostsQuery(uid);

  const metrics: AchievementMetrics = useMemo(() => {
    const t = tasks ?? [];
    const acts = mergeActsDefaults(userInfo?.ActsSettings);
    return {
      streakDays: computeCompletionStreak(t, acts),
      lifetimeXp: Math.max(0, Math.floor(Number(userInfo?.LifetimeXP ?? 0))),
      actsCompleted: t.filter((x) => x.completedAt != null).length,
      deedPostsAuthored: myPosts?.length ?? 0,
    };
  }, [tasks, userInfo?.LifetimeXP, userInfo?.ActsSettings, myPosts]);

  const metricsKey = useMemo(
    () => `${metrics.streakDays}|${metrics.lifetimeXp}|${metrics.actsCompleted}|${metrics.deedPostsAuthored}`,
    [metrics],
  );

  const dataReady = Boolean(uid) && !tasksPending && !myPostsPending;

  const [seenIds, setSeenIds] = useState<Set<string>>(() => new Set());
  const [seenReady, setSeenReady] = useState(false);
  const [queue, setQueue] = useState<AchievementDef[]>([]);
  const uidRef = useRef<string | undefined>(uid);

  useEffect(() => {
    if (!uid) {
      setSeenReady(false);
      setSeenIds(new Set());
      setQueue([]);
      uidRef.current = undefined;
      return;
    }
    if (uidRef.current !== uid) {
      uidRef.current = uid;
      setSeenReady(false);
      setSeenIds(new Set());
      setQueue([]);
    }
  }, [uid]);

  useEffect(() => {
    if (!uid || !dataReady) {
      return;
    }
    let cancelled = false;
    const unlocked = computeUnlockedAchievementIds(metrics);
    void ensureAchievementBootstrap(uid, unlocked).then((set) => {
      if (cancelled) {
        return;
      }
      setSeenIds((prev) => {
        const merged = new Set(set);
        prev.forEach((id) => merged.add(id));
        return merged;
      });
      setSeenReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, [uid, dataReady, metricsKey, metrics]);

  useEffect(() => {
    if (!uid || !seenReady) {
      return;
    }
    setQueue((prev) => {
      const unlocked = new Set(computeUnlockedAchievementIds(metrics));
      const queued = new Set(prev.map((p) => p.id));
      const additions = ACHIEVEMENTS.filter((a) => unlocked.has(a.id) && !seenIds.has(a.id) && !queued.has(a.id));
      if (additions.length === 0) {
        return prev;
      }
      return [...prev, ...additions];
    });
  }, [uid, seenReady, metricsKey, metrics, seenIds]);

  const current = queue[0] ?? null;

  const onOverlayClose = useCallback(() => {
    if (!uid || !current) {
      return;
    }
    const id = current.id;
    setSeenIds((prev) => {
      const next = new Set(prev);
      next.add(id);
      void appendAchievementSeen(uid, id, prev);
      return next;
    });
    setQueue((q) => q.slice(1));
  }, [uid, current]);

  return (
    <>
      <AchievementUnlockedOverlay achievement={current} onClose={onOverlayClose} />
    </>
  );
}
