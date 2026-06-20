import AsyncStorage from '@react-native-async-storage/async-storage';

const storageKey = (uid: string) => `@acts/rewards_discovery_v1_${uid}`;

/** User dismissed the post-first-act Rewards discovery card. */
export async function getRewardsDiscoveryDismissed(uid: string): Promise<boolean> {
  try {
    return (await AsyncStorage.getItem(storageKey(uid))) === '1';
  } catch {
    return false;
  }
}

export async function setRewardsDiscoveryDismissed(uid: string): Promise<void> {
  try {
    await AsyncStorage.setItem(storageKey(uid), '1');
  } catch {
    /* best-effort */
  }
}
