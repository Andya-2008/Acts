import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'acts.appUpdate.dismissedEasUpdateId';

export async function getDismissedEasUpdateId(): Promise<string | null> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    return raw?.trim() || null;
  } catch {
    return null;
  }
}

export async function setDismissedEasUpdateId(updateId: string): Promise<void> {
  try {
    await AsyncStorage.setItem(KEY, updateId.trim());
  } catch {
    /* best-effort */
  }
}
