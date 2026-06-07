import AsyncStorage from '@react-native-async-storage/async-storage';

const storageKey = (uid: string) => `@acts/first_act_prompt_v1_${uid}`;

/** User finished or dismissed the first-act onboarding prompt. */
export async function getFirstActPromptDone(uid: string): Promise<boolean> {
  try {
    return (await AsyncStorage.getItem(storageKey(uid))) === '1';
  } catch {
    return false;
  }
}

export async function setFirstActPromptDone(uid: string): Promise<void> {
  try {
    await AsyncStorage.setItem(storageKey(uid), '1');
  } catch {
    /* best-effort */
  }
}
