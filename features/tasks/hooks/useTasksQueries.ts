import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { tasksQueryKeys } from '@/features/tasks/queryKeys';
import {
  addUserTask,
  clearAllTaskPhotosForUser,
  clearTaskPhoto,
  ensureAssignedTasks,
  fetchTaskCatalogFromFirestore,
  fetchTasksForUser,
  saveTaskPhotoFromLocalUri,
  setTaskCompleted,
} from '@/features/tasks/services/taskRepository';

export function useTasksQuery(uid: string | undefined) {
  return useQuery({
    queryKey: uid ? tasksQueryKeys.list(uid) : [...tasksQueryKeys.all, '__none__'],
    queryFn: () => fetchTasksForUser(uid!),
    enabled: Boolean(uid),
    staleTime: 15_000,
  });
}

/** Global catalog under `tasks/{dailyTask|weeklyTask|monthlyTask}/…` (same for all users). */
export function useTaskCatalogQuery(enabled = true) {
  return useQuery({
    queryKey: tasksQueryKeys.firestoreCatalog(),
    queryFn: fetchTaskCatalogFromFirestore,
    enabled,
    staleTime: 300_000,
  });
}

export function useEnsureAssignedTasksMutation(uid: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      if (!uid) {
        throw new Error('Not signed in');
      }
      await ensureAssignedTasks(uid);
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: tasksQueryKeys.firestoreCatalog() });
      if (uid) {
        await qc.invalidateQueries({ queryKey: tasksQueryKeys.list(uid) });
      }
    },
  });
}

export function useToggleTaskCompleteMutation(uid: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      taskId,
      completed,
      completionLedger,
    }: {
      taskId: string;
      completed: boolean;
      completionLedger?: { seeds: number; xp: number } | null;
    }) => {
      if (!uid) {
        throw new Error('Not signed in');
      }
      await setTaskCompleted(uid, taskId, completed, completionLedger ?? null);
    },
    onSuccess: async () => {
      if (uid) {
        await qc.invalidateQueries({ queryKey: tasksQueryKeys.list(uid) });
      }
    },
  });
}

export function useAddTaskMutation(uid: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (title: string) => {
      if (!uid) {
        throw new Error('Not signed in');
      }
      await addUserTask(uid, title);
    },
    onSuccess: async () => {
      if (uid) {
        await qc.invalidateQueries({ queryKey: tasksQueryKeys.list(uid) });
      }
    },
  });
}

export function useSaveTaskPhotoMutation(uid: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ taskId, localUri }: { taskId: string; localUri: string }) => {
      if (!uid) {
        throw new Error('Not signed in');
      }
      await saveTaskPhotoFromLocalUri(uid, taskId, localUri);
    },
    onSuccess: async () => {
      if (uid) {
        await qc.invalidateQueries({ queryKey: tasksQueryKeys.list(uid) });
      }
    },
  });
}

export function useClearTaskPhotoMutation(uid: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (taskId: string) => {
      if (!uid) {
        throw new Error('Not signed in');
      }
      await clearTaskPhoto(uid, taskId);
    },
    onSuccess: async () => {
      if (uid) {
        await qc.invalidateQueries({ queryKey: tasksQueryKeys.list(uid) });
      }
    },
  });
}

export function useClearAllTaskPhotosMutation(uid: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      if (!uid) {
        throw new Error('Not signed in');
      }
      await clearAllTaskPhotosForUser(uid);
    },
    onSuccess: async () => {
      if (uid) {
        await qc.invalidateQueries({ queryKey: tasksQueryKeys.list(uid) });
      }
    },
  });
}
