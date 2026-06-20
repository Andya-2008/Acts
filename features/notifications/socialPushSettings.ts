import type { ActsAppSettings } from '@/shared/types/actsSettings';

/** True when the user wants any server-delivered social push alerts. */
export function wantsSocialPush(settings: ActsAppSettings): boolean {
  return (
    settings.notifyFriendsPosting !== false ||
    settings.notifyFriendsReactions !== false ||
    settings.notifyFriendRequests !== false ||
    settings.notifyFriendRequestAccepted !== false
  );
}
