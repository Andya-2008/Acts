import AsyncStorage from '@react-native-async-storage/async-storage';

const storageKey = (uid: string) => `@acts/first_run_tutorial_v1_${uid}`;

export async function getFirstRunTutorialDone(uid: string): Promise<boolean> {
  try {
    const v = await AsyncStorage.getItem(storageKey(uid));
    return v === '1';
  } catch {
    return false;
  }
}

export async function setFirstRunTutorialDone(uid: string): Promise<void> {
  await AsyncStorage.setItem(storageKey(uid), '1');
}
