import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { fetchDerivedNotifications } from '@/features/notifications/derivedNotifications';
import {
  ACTIVITY_NOTIFICATION_IDS as AID,
  ANDROID_CHANNEL_ACTIVITY,
} from '@/features/notifications/notificationIds';
import {
  getLastActivityRunAt,
  getLastSocialNotifiedAt,
  getTaskSnapshot,
  setLastActivityRunAt,
  setLastSocialNotifiedAt,
  setTaskSnapshot,
} from '@/features/notifications/notificationsLocalState';
import type { ActsAppSettings } from '@/shared/types/actsSettings';
import type { ActTask } from '@/shared/types/task';

/** Don't re-scan/notify for social activity more often than this on foreground. */
const MIN_RUN_INTERVAL_MS = 4 * 60_000;

let channelReady = false;

async function ensureActivityChannel(): Promise<void> {
  if (Platform.OS !== 'android' || channelReady) {
    return;
  }
  await Notifications.setNotificationChannelAsync(ANDROID_CHANNEL_ACTIVITY, {
    name: 'Friends & activity',
    importance: Notifications.AndroidImportance.DEFAULT,
    description: 'Reactions, comments, friend requests, and new acts',
  });
  channelReady = true;
}

async function hasPermission(): Promise<boolean> {
  const perm = await Notifications.getPermissionsAsync();
  return perm.status === 'granted';
}

function socialTypeAllowed(type: string, settings: ActsAppSettings): boolean {
  switch (type) {
    case 'deed_reaction':
      return settings.notifyFriendsReactions !== false;
    case 'deed_comment':
      // Comments piggy-back on the reactions toggle (no separate setting today).
      return settings.notifyFriendsReactions !== false;
    case 'friend_post':
      return settings.notifyFriendsPosting !== false;
    case 'friend_request':
      return settings.notifyFriendRequests !== false;
    default:
      return false;
  }
}

export type ActivitySyncInput = {
  uid: string | undefined;
  tasks: ActTask[] | undefined;
  settings: ActsAppSettings;
  /** Force a run regardless of throttle (e.g. explicit refresh). */
  force?: boolean;
};

/**
 * Fires local (on-device) notifications for activity the client can detect while
 * running: acts newly added to the list, and new social activity (reactions,
 * comments, friend posts, friend requests) since the last time we notified.
 *
 * This is best-effort and only runs when the app is open/foregrounded - true
 * push delivery while the app is closed requires a server (Cloud Functions + the
 * Expo push token we already store). Gated by the user's notification settings.
 */
export async function syncActivityNotifications(input: ActivitySyncInput): Promise<void> {
  if (Platform.OS === 'web') {
    return;
  }
  const { uid, tasks, settings, force } = input;
  if (!uid) {
    return;
  }
  if (!(await hasPermission())) {
    return;
  }

  const now = Date.now();
  if (!force) {
    const lastRun = await getLastActivityRunAt(uid);
    if (now - lastRun < MIN_RUN_INTERVAL_MS) {
      return;
    }
  }
  await setLastActivityRunAt(uid, now);
  await ensureActivityChannel();
  const channel = Platform.OS === 'android' ? { channelId: ANDROID_CHANNEL_ACTIVITY } : {};

  // --- New acts added to the list ---------------------------------------------
  if (settings.notifyNewActs !== false && tasks) {
    const activeIds = tasks.filter((t) => t.active).map((t) => t.id);
    const snapshot = await getTaskSnapshot(uid);
    if (snapshot != null) {
      const newlyAdded = activeIds.filter((id) => !snapshot.has(id));
      if (newlyAdded.length > 0) {
        await Notifications.scheduleNotificationAsync({
          identifier: AID.newTasks,
          content: {
            title: newlyAdded.length === 1 ? 'A new act is on your list' : `${newlyAdded.length} new acts added`,
            body: 'Open Acts to pick one and earn seeds and XP.',
            data: { screen: 'tasks' },
          },
          trigger: null,
        });
      }
    }
    await setTaskSnapshot(uid, activeIds);
  }

  // --- New social activity -----------------------------------------------------
  const wantsSocial =
    settings.notifyFriendsReactions !== false ||
    settings.notifyFriendsPosting !== false ||
    settings.notifyFriendRequests !== false;
  if (!wantsSocial) {
    return;
  }

  let social: Awaited<ReturnType<typeof fetchDerivedNotifications>> = [];
  try {
    social = await fetchDerivedNotifications(uid);
  } catch {
    return;
  }

  const lastNotified = await getLastSocialNotifiedAt(uid);
  const fresh = social.filter(
    (n) => n.type !== 'new_tasks' && n.timestampMs > lastNotified && socialTypeAllowed(n.type, settings),
  );
  if (fresh.length === 0) {
    return;
  }

  const newestMs = Math.max(...fresh.map((n) => n.timestampMs));
  const lead = [...fresh].sort((a, b) => b.timestampMs - a.timestampMs)[0]!;
  const title = fresh.length === 1 ? fresh[0]!.title.replace(/^[^\w]+/, '').trim() || 'New activity' : 'New activity on Acts';
  const body =
    fresh.length === 1
      ? fresh[0]!.message
      : `You have ${fresh.length} new updates from friends. Open Acts to see them.`;

  let screen = 'notifications';
  let postId: string | undefined;
  if (lead.type === 'friend_request') {
    screen = 'friends';
  } else if (lead.postId) {
    screen = 'deed-feed';
    postId = lead.postId;
  }

  await Notifications.scheduleNotificationAsync({
    identifier: AID.socialActivity,
    content: {
      title,
      body,
      data: {
        screen,
        type: lead.type,
        ...(postId ? { postId } : {}),
      },
    },
    trigger: null,
  });
  await setLastSocialNotifiedAt(uid, newestMs);
}
