import AsyncStorage from '@react-native-async-storage/async-storage';

const MAX_RECENT = 72;

function storageKey(uid: string): string {
  return `@acts/friend_suggestion_recent_v1_${uid}`;
}

/** Uids recently shown in the suggestions rail so the next refresh can surface new people. */
export async function getRecentFriendSuggestionUids(uid: string): Promise<string[]> {
  try {
    const raw = await AsyncStorage.getItem(storageKey(uid));
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed.filter((value): value is string => typeof value === 'string' && value.length > 0);
  } catch {
    return [];
  }
}

export async function markFriendSuggestionsShown(uid: string, shownUids: string[]): Promise<void> {
  if (shownUids.length === 0) {
    return;
  }
  try {
    const prev = await getRecentFriendSuggestionUids(uid);
    const merged = [...prev];
    for (const id of shownUids) {
      if (!merged.includes(id)) {
        merged.push(id);
      }
    }
    const trimmed = merged.slice(-MAX_RECENT);
    await AsyncStorage.setItem(storageKey(uid), JSON.stringify(trimmed));
  } catch {
    // ignore
  }
}

export async function clearRecentFriendSuggestionUids(uid: string): Promise<void> {
  try {
    await AsyncStorage.removeItem(storageKey(uid));
  } catch {
    // ignore
  }
}
