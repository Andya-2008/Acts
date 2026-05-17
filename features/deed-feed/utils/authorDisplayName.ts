import type { User } from 'firebase/auth';

import type { UserInfoRead } from '@/shared/types/userInfo';

/** Display name stored on deed feed posts (matches profile → auth display name). */
export function authorDisplayNameForDeed(userInfo: UserInfoRead | null | undefined, user: User | null): string {
  const fromProfile = [userInfo?.First, userInfo?.Last].filter(Boolean).join(' ').trim();
  if (fromProfile.length > 0) {
    return fromProfile;
  }
  return user?.displayName?.trim() || 'Friend';
}
