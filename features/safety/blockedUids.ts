import type { UserInfoRead } from '@/shared/types/userInfo';

export function getBlockedUidSet(info: UserInfoRead | null | undefined): Set<string> {
  const raw = info?.BlockedUids;
  if (!Array.isArray(raw)) {
    return new Set();
  }
  return new Set(raw.filter((x): x is string => typeof x === 'string' && x.trim().length > 0).map((x) => x.trim()));
}

export function isUidBlocked(info: UserInfoRead | null | undefined, otherUid: string | undefined): boolean {
  if (!otherUid) {
    return false;
  }
  return getBlockedUidSet(info).has(otherUid.trim());
}
