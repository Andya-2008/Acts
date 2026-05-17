import { useQuery } from '@tanstack/react-query';

import { fetchUserInfo } from '@/features/user-profile/services/userInfoRepository';
import { userInfoQueryKeys } from '@/features/user-profile/queryKeys';

export function useUserInfoQuery(uid: string | undefined) {
  return useQuery({
    queryKey: uid ? userInfoQueryKeys.detail(uid) : [...userInfoQueryKeys.all, '__none__'],
    queryFn: () => fetchUserInfo(uid!),
    enabled: Boolean(uid),
    staleTime: 30_000,
  });
}
