import { useQuery } from '@tanstack/react-query';
import { useCallback, useEffect, useMemo } from 'react';

import {
  deriveNewTaskNotifications,
  fetchDerivedNotifications,
  type DerivedNotification,
} from '@/features/notifications/derivedNotifications';
import { useNotificationsSeenStore } from '@/features/notifications/notificationsSeenStore';
import { useTasksQuery } from '@/features/tasks/hooks/useTasksQueries';

export const derivedNotificationKeys = {
  all: ['derivedNotifications'] as const,
  list: (uid: string) => [...derivedNotificationKeys.all, uid] as const,
};

/**
 * Loads the derived notification inbox and combines it with locally-derived
 * "new tasks" items (from the already-cached task list), plus device-local
 * unread tracking.
 */
export function useDerivedNotifications(uid: string | undefined) {
  const { data: tasks } = useTasksQuery(uid);
  const remote = useQuery({
    queryKey: uid ? derivedNotificationKeys.list(uid) : [...derivedNotificationKeys.all, '__none__'],
    queryFn: () => fetchDerivedNotifications(uid!),
    enabled: Boolean(uid),
    staleTime: 60_000,
    refetchInterval: 5 * 60_000,
  });

  const items = useMemo<DerivedNotification[]>(() => {
    const taskItems = deriveNewTaskNotifications(tasks);
    const merged = [...(remote.data ?? []), ...taskItems];
    merged.sort((a, b) => b.timestampMs - a.timestampMs);
    return merged;
  }, [remote.data, tasks]);

  const lastSeenAt = useNotificationsSeenStore((s) => s.lastSeenAt);
  const hydrateSeen = useNotificationsSeenStore((s) => s.hydrate);
  const markSeen = useNotificationsSeenStore((s) => s.markSeen);
  useEffect(() => {
    if (uid) {
      void hydrateSeen(uid);
    }
  }, [uid, hydrateSeen]);

  const unreadCount = useMemo(
    () => items.filter((i) => i.timestampMs > lastSeenAt).length,
    [items, lastSeenAt],
  );

  const markAllSeen = useCallback(async () => {
    if (!uid) {
      return;
    }
    await markSeen(uid);
  }, [uid, markSeen]);

  return {
    items,
    isLoading: remote.isLoading,
    isError: remote.isError,
    refetch: remote.refetch,
    isRefetching: remote.isRefetching,
    lastSeenAt,
    unreadCount,
    markAllSeen,
  };
}

/** Lightweight unread badge — shares the cache with {@link useDerivedNotifications}. */
export function useNotificationsUnreadCount(uid: string | undefined): number {
  return useDerivedNotifications(uid).unreadCount;
}
