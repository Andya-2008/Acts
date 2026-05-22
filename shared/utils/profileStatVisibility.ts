import type { ProfileStatVisibility } from '@/shared/types/actsSettings';

/**
 * Whether a profile stat should render for the current viewer.
 * The profile owner always sees their own stats on their device.
 */
export function profileStatVisibleForViewer(
  visibility: ProfileStatVisibility,
  ctx: { isSelf: boolean; isFriend: boolean },
): boolean {
  if (ctx.isSelf) {
    return true;
  }
  if (visibility === 'only_me') {
    return false;
  }
  if (visibility === 'friends_only') {
    return ctx.isFriend;
  }
  return visibility === 'public';
}

/** Bio is always shown on profiles for signed-in viewers (not gated like rank/streak). */
export function profileBioVisibleForViewer(): boolean {
  return true;
}
