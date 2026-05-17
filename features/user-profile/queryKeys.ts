export const userInfoQueryKeys = {
  all: ['userInfo'] as const,
  detail: (uid: string) => [...userInfoQueryKeys.all, uid] as const,
};
