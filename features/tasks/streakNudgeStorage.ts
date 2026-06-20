import AsyncStorage from '@react-native-async-storage/async-storage';

import { localDateKey } from '@/features/user-profile/utils/computeCompletionStreak';

const storageKey = (uid: string, dayKey: string) => `@acts/streak_nudge_dismiss_v1_${uid}_${dayKey}`;

/** User dismissed the streak-at-risk card for this local calendar day. */
export async function getStreakNudgeDismissed(uid: string, dayKey = localDateKey(new Date())): Promise<boolean> {
  try {
    return (await AsyncStorage.getItem(storageKey(uid, dayKey))) === '1';
  } catch {
    return false;
  }
}

export async function setStreakNudgeDismissed(uid: string, dayKey = localDateKey(new Date())): Promise<void> {
  try {
    await AsyncStorage.setItem(storageKey(uid, dayKey), '1');
  } catch {
    /* best-effort */
  }
}
