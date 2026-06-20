import AsyncStorage from '@react-native-async-storage/async-storage';

export type TaskListViewMode = 'focus' | 'all';

const storageKey = (uid: string) => `@acts/task_list_view_v1_${uid}`;

export async function getTaskListViewMode(uid: string): Promise<TaskListViewMode | null> {
  try {
    const raw = await AsyncStorage.getItem(storageKey(uid));
    return raw === 'focus' || raw === 'all' ? raw : null;
  } catch {
    return null;
  }
}

export async function setTaskListViewMode(uid: string, mode: TaskListViewMode): Promise<void> {
  try {
    await AsyncStorage.setItem(storageKey(uid), mode);
  } catch {
    /* best-effort */
  }
}

/** Focus view when the roster is large enough to benefit from curation. */
export function defaultTaskListViewMode(incompleteCount: number): TaskListViewMode {
  return incompleteCount > 3 ? 'focus' : 'all';
}
