import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Device-local notification bookkeeping: when the inbox was last viewed (for the
 * unread badge), the last task set we notified about, and throttle timestamps for
 * local OS notifications. None of this is shared data — it's per device/user.
 */

const LAST_SEEN_KEY = (uid: string) => `@acts/notif_last_seen_${uid}`;
const TASK_SNAPSHOT_KEY = (uid: string) => `@acts/notif_task_snapshot_${uid}`;
const LAST_SOCIAL_NOTIFIED_KEY = (uid: string) => `@acts/notif_last_social_${uid}`;
const LAST_ACTIVITY_RUN_KEY = (uid: string) => `@acts/notif_last_run_${uid}`;

async function getNum(key: string): Promise<number> {
  try {
    const raw = await AsyncStorage.getItem(key);
    const n = raw ? Number(raw) : 0;
    return Number.isFinite(n) ? n : 0;
  } catch {
    return 0;
  }
}

async function setNum(key: string, value: number): Promise<void> {
  try {
    await AsyncStorage.setItem(key, String(value));
  } catch {
    // ignore
  }
}

export function getNotificationsLastSeenAt(uid: string): Promise<number> {
  return getNum(LAST_SEEN_KEY(uid));
}

export function setNotificationsLastSeenAt(uid: string, ms: number): Promise<void> {
  return setNum(LAST_SEEN_KEY(uid), ms);
}

export function getLastSocialNotifiedAt(uid: string): Promise<number> {
  return getNum(LAST_SOCIAL_NOTIFIED_KEY(uid));
}

export function setLastSocialNotifiedAt(uid: string, ms: number): Promise<void> {
  return setNum(LAST_SOCIAL_NOTIFIED_KEY(uid), ms);
}

export function getLastActivityRunAt(uid: string): Promise<number> {
  return getNum(LAST_ACTIVITY_RUN_KEY(uid));
}

export function setLastActivityRunAt(uid: string, ms: number): Promise<void> {
  return setNum(LAST_ACTIVITY_RUN_KEY(uid), ms);
}

/** Returns the stored set of task ids we've already seen on this device (null = first run). */
export async function getTaskSnapshot(uid: string): Promise<Set<string> | null> {
  try {
    const raw = await AsyncStorage.getItem(TASK_SNAPSHOT_KEY(uid));
    if (raw == null) {
      return null;
    }
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) {
      return new Set();
    }
    return new Set(parsed.filter((v): v is string => typeof v === 'string'));
  } catch {
    return new Set();
  }
}

export async function setTaskSnapshot(uid: string, ids: string[]): Promise<void> {
  try {
    await AsyncStorage.setItem(TASK_SNAPSHOT_KEY(uid), JSON.stringify(ids));
  } catch {
    // ignore
  }
}
