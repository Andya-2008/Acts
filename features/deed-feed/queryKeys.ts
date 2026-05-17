export const deedPostsQueryKeys = {
  all: ['deedPosts'] as const,
  friends: (viewerUid: string, friendsSortedKey: string) =>
    [...deedPostsQueryKeys.all, 'friends', viewerUid, friendsSortedKey] as const,
  mine: (uid: string) => [...deedPostsQueryKeys.all, 'mine', uid] as const,
  reactions: (viewerUid: string, postIdsKey: string) =>
    [...deedPostsQueryKeys.all, 'reactions', viewerUid, postIdsKey] as const,
  comments: (viewerUid: string, postIdsKey: string) =>
    [...deedPostsQueryKeys.all, 'comments', viewerUid, postIdsKey] as const,
  authorPics: (uidsKey: string) => [...deedPostsQueryKeys.all, 'authorPics', uidsKey] as const,
};
