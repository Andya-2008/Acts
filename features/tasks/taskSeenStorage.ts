import AsyncStorage from '@react-native-async-storage/async-storage';

import type { ActTask } from '@/shared/types/task';

/**
 * Tracks which assigned acts a user has already seen on the Tasks tab, so freshly
 * rotated-in acts can wear an exciting "New" marker until they've been viewed.
 * Stored locally per user, since "seen" is a device-side presentation detail.
 */

const SEEN_KEY = (uid: string) => `@acts/tasks_seen_v1_${uid}`;
/** Keep the most-recent N ids so the list can't grow without bound. */
const MAX_SEEN_IDS = 800;

/** Cadence acts get a fresh "New" badge each calendar period; custom acts use stable ids. */
export function taskSeenKey(task: Pick<ActTask, 'id' | 'cadence' | 'assignedPeriodKey'>): string {
  if (task.cadence === 'daily' || task.cadence === 'weekly' || task.cadence === 'monthly') {
    const period = task.assignedPeriodKey?.trim();
    if (period) {
      return `${task.id}@${period}`;
    }
  }
  return task.id;
}

export async function loadSeenTaskIds(uid: string): Promise<Set<string>> {
  try {
    const raw = await AsyncStorage.getItem(SEEN_KEY(uid));
    if (!raw) {
      return new Set();
    }
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) {
      return new Set();
    }
    return new Set(parsed.filter((v): v is string => typeof v === 'string'));
  } catch {
    return new Set();
  }
}

/** Merge newly-seen ids into storage, keeping the most recent ones first. */
export async function addSeenTaskIds(uid: string, ids: string[]): Promise<void> {
  const clean = ids.map((s) => s.trim()).filter((s) => s.length > 0);
  if (clean.length === 0) {
    return;
  }
  try {
    const existing = await loadSeenTaskIds(uid);
    const merged: string[] = [...clean];
    for (const id of existing) {
      if (!clean.includes(id)) {
        merged.push(id);
      }
    }
    const capped = merged.slice(0, MAX_SEEN_IDS);
    await AsyncStorage.setItem(SEEN_KEY(uid), JSON.stringify(capped));
  } catch {
    // best-effort; losing seen state only means a "New" marker may show once more
  }
}
