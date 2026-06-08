import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'acts.appUpdate.dismissedStoreVersion';

export async function getDismissedAppStoreVersion(): Promise<string | null> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    return raw?.trim() || null;
  } catch {
    return null;
  }
}

export async function setDismissedAppStoreVersion(version: string): Promise<void> {
  try {
    await AsyncStorage.setItem(KEY, version.trim());
  } catch {
    /* best-effort */
  }
}
