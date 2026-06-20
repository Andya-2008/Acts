import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import {
  ACHIEVEMENTS,
  computeUnlockedAchievementIds,
  type AchievementMetrics,
} from '@/features/achievements/achievementCatalog';
import { AchievementUnlockedOverlay } from '@/features/achievements/components/AchievementUnlockedOverlay';
import { appendAchievementSeen, ensureAchievementBootstrap } from '@/features/achievements/achievementSeenStorage';
import { useMyDeedPostsQuery } from '@/features/deed-feed/hooks/useDeedPostsQueries';
import { StreakMilestoneOverlay } from '@/features/progression/components/StreakMilestoneOverlay';
import {
  achievementIdForStreakDays,
  newlyCrossedStreakMilestones,
  streakMilestoneMessage,
  streakMilestoneTitle,
} from '@/features/progression/streakMilestones';
import { useProgressionCelebrationStore } from '@/features/progression/progressionCelebrationStore';
import { useTasksQuery } from '@/features/tasks/hooks/useTasksQueries';
import { ServiceRankUpOverlay } from '@/features/user-profile/components/ServiceRankUpOverlay';
import { computeCompletionStreak } from '@/features/user-profile/utils/computeCompletionStreak';
import { useUserInfoQuery } from '@/features/user-profile/hooks/useUserInfoQuery';
import { trackAchievementUnlocked } from '@/shared/services/firebase/analytics';
import { useAuthStore } from '@/shared/stores/authStore';
import { mergeActsDefaults } from '@/shared/types/actsSettings';

/**
 * Unified progression queue: rank-ups, streak milestones, and achievement unlocks
 * (one full-screen moment at a time). Mount once under the authenticated app shell.
 */
export function ProgressionCelebrationHost() {
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
  const queue = useProgressionCelebrationStore((s) => s.queue);
  const enqueue = useProgressionCelebrationStore((s) => s.enqueue);
  const advance = useProgressionCelebrationStore((s) => s.advance);

  const [seenIds, setSeenIds] = useState<Set<string>>(() => new Set());
  const [seenReady, setSeenReady] = useState(false);
  const uidRef = useRef<string | undefined>(uid);
  const prevStreakDaysRef = useRef<number | null>(null);

  useEffect(() => {
    if (!uid) {
      setSeenReady(false);
      setSeenIds(new Set());
      uidRef.current = undefined;
      prevStreakDaysRef.current = null;
      return;
    }
    if (uidRef.current !== uid) {
      uidRef.current = uid;
      setSeenReady(false);
      setSeenIds(new Set());
      prevStreakDaysRef.current = null;
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

    const unlocked = new Set(computeUnlockedAchievementIds(metrics));
    const additions = ACHIEVEMENTS.filter((a) => unlocked.has(a.id) && !seenIds.has(a.id));
    const queuedAchievementIds = new Set(
      useProgressionCelebrationStore
        .getState()
        .queue.filter((item) => item.kind === 'achievement')
        .map((item) => item.achievement.id),
    );

    for (const achievement of additions) {
      if (!queuedAchievementIds.has(achievement.id)) {
        enqueue({ kind: 'achievement', achievement });
      }
    }

    const prevStreak = prevStreakDaysRef.current;
    const nextStreak = metrics.streakDays;
    if (prevStreak != null && nextStreak > prevStreak) {
      const crossed = newlyCrossedStreakMilestones(prevStreak, nextStreak);
      for (const days of crossed) {
        const achId = achievementIdForStreakDays(days);
        const achievementUnlocksNow = achId != null && additions.some((a) => a.id === achId);
        if (achievementUnlocksNow) {
          continue;
        }
        enqueue({
          kind: 'streak_milestone',
          days,
          title: streakMilestoneTitle(days),
          message: streakMilestoneMessage(days),
        });
      }
    }
    prevStreakDaysRef.current = nextStreak;
  }, [uid, seenReady, metricsKey, metrics, seenIds, enqueue]);

  const current = queue[0] ?? null;

  const onAchievementClose = useCallback(() => {
    if (!uid || current?.kind !== 'achievement') {
      advance();
      return;
    }
    const id = current.achievement.id;
    trackAchievementUnlocked(id);
    setSeenIds((prev) => {
      const next = new Set(prev);
      next.add(id);
      void appendAchievementSeen(uid, id, prev);
      return next;
    });
    advance();
  }, [uid, current, advance]);

  const onAdvance = useCallback(() => {
    advance();
  }, [advance]);

  if (current?.kind === 'rank_up') {
    return <ServiceRankUpOverlay payload={current.payload} onClose={onAdvance} />;
  }

  if (current?.kind === 'streak_milestone') {
    return (
      <StreakMilestoneOverlay
        days={current.days}
        title={current.title}
        message={current.message}
        onClose={onAdvance}
      />
    );
  }

  if (current?.kind === 'achievement') {
    return <AchievementUnlockedOverlay achievement={current.achievement} onClose={onAchievementClose} />;
  }

  return null;
}
