import type { Href } from 'expo-router';

import type { DerivedNotification, DerivedNotificationType } from '@/features/notifications/derivedNotifications';

export type NotificationNavPayload = {
  screen?: string;
  postId?: string;
  type?: string;
  newUserUid?: string;
};

function normalizePostId(value: unknown): string | undefined {
  if (typeof value === 'string' && value.trim().length > 0) {
    return value.trim();
  }
  return undefined;
}

/** Deep link into the deed feed tab (index screen), optionally focusing one post. */
export function deedFeedHref(postId?: string): Href {
  if (postId) {
    return `/(app)/(tabs)/deed-feed?postId=${encodeURIComponent(postId)}` as Href;
  }
  return '/(app)/(tabs)/deed-feed' as Href;
}

/** Maps push / local notification `data` to an expo-router destination. */
export function hrefForNotificationPayload(payload: NotificationNavPayload): Href {
  const screen = payload.screen?.trim().toLowerCase();
  const postId = normalizePostId(payload.postId);
  const typeRaw = payload.type?.trim().toLowerCase();
  const type = typeRaw as DerivedNotificationType | undefined;

  if (
    typeRaw === 'friend_request' ||
    typeRaw === 'invite_join' ||
    screen === 'friends' ||
    screen === 'friend-requests'
  ) {
    return '/(app)/(tabs)/deed-feed/friends' as Href;
  }
  if (type === 'new_tasks' || screen === 'tasks') {
    return '/(app)/(tabs)/tasks' as Href;
  }
  if (screen === 'notifications' || screen === 'activity') {
    return '/(app)/notifications' as Href;
  }
  if (screen === 'deed-feed' || postId || type === 'deed_reaction' || type === 'deed_comment' || type === 'friend_post') {
    return deedFeedHref(postId);
  }
  return '/(app)/(tabs)/tasks' as Href;
}

/** In-app activity inbox row tap target. */
export function hrefForDerivedNotification(item: DerivedNotification): Href {
  switch (item.type) {
    case 'friend_request':
      return '/(app)/(tabs)/deed-feed/friends' as Href;
    case 'new_tasks':
      return '/(app)/(tabs)/tasks' as Href;
    case 'deed_reaction':
    case 'deed_comment':
    case 'friend_post':
      return deedFeedHref(item.postId);
    default:
      return '/(app)/notifications' as Href;
  }
}
