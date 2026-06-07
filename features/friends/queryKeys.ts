export const friendsQueryKeys = {
  all: ['friends'] as const,
  incoming: (uid: string) => [...friendsQueryKeys.all, 'incoming', uid] as const,
  outgoing: (uid: string) => [...friendsQueryKeys.all, 'outgoing', uid] as const,
  edges: (uid: string) => [...friendsQueryKeys.all, 'edges', uid] as const,
  /** All `userInfo/{uid}/friends/{friendUid}` doc ids - used for deed feed queries (not filtered by profile fields). */
  friendUids: (uid: string) => [...friendsQueryKeys.all, 'friendUids', uid] as const,
  relation: (meUid: string, profileUid: string) =>
    [...friendsQueryKeys.all, 'relation', meUid, profileUid] as const,
  mutualFriends: (meUid: string, profileUid: string) =>
    [...friendsQueryKeys.all, 'mutual', meUid, profileUid] as const,
  suggestions: (uid: string, contactKey = '') =>
    [...friendsQueryKeys.all, 'suggestions', uid, contactKey] as const,
};
