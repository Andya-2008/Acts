import AsyncStorage from '@react-native-async-storage/async-storage';

const storageKey = (uid: string, lastCompletionMs: number) =>
  `@acts/win_back_prompt_v1_${uid}_${lastCompletionMs}`;

/** User dismissed the win-back card for this inactivity episode (keyed by last completion time). */
export async function getWinBackPromptDismissed(uid: string, lastCompletionMs: number): Promise<boolean> {
  if (lastCompletionMs <= 0) {
    return false;
  }
  try {
    return (await AsyncStorage.getItem(storageKey(uid, lastCompletionMs))) === '1';
  } catch {
    return false;
  }
}

export async function setWinBackPromptDismissed(uid: string, lastCompletionMs: number): Promise<void> {
  if (lastCompletionMs <= 0) {
    return;
  }
  try {
    await AsyncStorage.setItem(storageKey(uid, lastCompletionMs), '1');
  } catch {
    /* best-effort */
  }
}
