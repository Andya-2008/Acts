import AsyncStorage from '@react-native-async-storage/async-storage';

const lastVersionKey = (uid: string) => `@acts/release_highlights/last_app_version_${uid}`;
const seenVersionKey = (uid: string) => `@acts/release_highlights/seen_${uid}`;

export async function getLastRecordedAppVersion(uid: string): Promise<string | null> {
  try {
    const raw = await AsyncStorage.getItem(lastVersionKey(uid));
    return raw?.trim() || null;
  } catch {
    return null;
  }
}

export async function setLastRecordedAppVersion(uid: string, version: string): Promise<void> {
  try {
    await AsyncStorage.setItem(lastVersionKey(uid), version.trim());
  } catch {
    /* best-effort */
  }
}

export async function getReleaseHighlightsSeenVersion(uid: string): Promise<string | null> {
  try {
    const raw = await AsyncStorage.getItem(seenVersionKey(uid));
    return raw?.trim() || null;
  } catch {
    return null;
  }
}

export async function setReleaseHighlightsSeenVersion(uid: string, version: string): Promise<void> {
  try {
    await AsyncStorage.setItem(seenVersionKey(uid), version.trim());
  } catch {
    /* best-effort */
  }
}
