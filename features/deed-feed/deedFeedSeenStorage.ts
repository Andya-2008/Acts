import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Tracks which friend deed posts a viewer has already seen, so the main feed can
 * surface only what's new (Instagram-style "you're all caught up"). Stored locally
 * per user — seen state is a device-side preference, not shared data.
 */

const SEEN_KEY = (uid: string) => `@acts/deed_feed_seen_v1_${uid}`;
/** Keep the most-recent N ids so the list can't grow without bound. */
const MAX_SEEN_IDS = 600;

export async function loadSeenPostIds(uid: string): Promise<Set<string>> {
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
export async function addSeenPostIds(uid: string, ids: string[]): Promise<void> {
  const clean = ids.map((s) => s.trim()).filter((s) => s.length > 0);
  if (clean.length === 0) {
    return;
  }
  try {
    const existing = await loadSeenPostIds(uid);
    // Newest ids go to the front; existing order preserved after.
    const merged: string[] = [...clean];
    for (const id of existing) {
      if (!clean.includes(id)) {
        merged.push(id);
      }
    }
    const capped = merged.slice(0, MAX_SEEN_IDS);
    await AsyncStorage.setItem(SEEN_KEY(uid), JSON.stringify(capped));
  } catch {
    // best-effort; losing seen state only means a post may show again
  }
}

/** Forget all seen ids for this user (used by "show everything again"). */
export async function clearSeenPostIds(uid: string): Promise<void> {
  try {
    await AsyncStorage.removeItem(SEEN_KEY(uid));
  } catch {
    // ignore
  }
}
