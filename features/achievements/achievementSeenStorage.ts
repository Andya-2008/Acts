import AsyncStorage from '@react-native-async-storage/async-storage';

const seenKey = (uid: string) => `@acts/achievements/seen_${uid}`;
const bootKey = (uid: string) => `@acts/achievements/boot_${uid}`;

async function readSeenSet(uid: string): Promise<Set<string>> {
  const raw = await AsyncStorage.getItem(seenKey(uid));
  if (!raw) {
    return new Set();
  }
  try {
    const arr = JSON.parse(raw) as unknown;
    if (!Array.isArray(arr)) {
      return new Set();
    }
    return new Set(arr.filter((x): x is string => typeof x === 'string'));
  } catch {
    return new Set();
  }
}

async function writeSeenSet(uid: string, ids: Set<string>): Promise<void> {
  await AsyncStorage.setItem(seenKey(uid), JSON.stringify([...ids]));
}

/**
 * First run per user: mark every currently-unlocked achievement as "celebration seen" so we don't
 * spam many overlays. New unlocks after that still celebrate.
 */
export async function ensureAchievementBootstrap(uid: string, currentlyUnlockedIds: string[]): Promise<Set<string>> {
  const booted = await AsyncStorage.getItem(bootKey(uid));
  if (booted) {
    return readSeenSet(uid);
  }
  /** Avoid locking in an empty "seen" set before tasks/XP have loaded (would queue many false unlocks). */
  if (currentlyUnlockedIds.length === 0) {
    return new Set();
  }
  /**
   * If someone already qualifies for many achievements on first run, mark them seen so we don't
   * stack dozens of modals. Light backlogs (few unlocks) still celebrate one-by-one.
   */
  const isHeavyBacklog = currentlyUnlockedIds.length > 3;
  const initial = isHeavyBacklog ? new Set(currentlyUnlockedIds) : new Set<string>();
  await writeSeenSet(uid, initial);
  await AsyncStorage.setItem(bootKey(uid), '1');
  return initial;
}

export async function appendAchievementSeen(uid: string, id: string, prior: Set<string>): Promise<Set<string>> {
  const next = new Set(prior);
  next.add(id);
  await writeSeenSet(uid, next);
  return next;
}
