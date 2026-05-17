import { useQuery } from '@tanstack/react-query';

import { deedPostsQueryKeys } from '@/features/deed-feed/queryKeys';
import { fetchProfilePicUrlsForUids } from '@/features/user-profile/services/userInfoRepository';

function uidsKey(uids: string[]): string {
  return [...new Set(uids.filter(Boolean))].sort().join(',');
}

export function useDeedFeedAuthorAvatarsQuery(authorUids: string[]) {
  const unique = [...new Set(authorUids.filter(Boolean))];
  const key = uidsKey(authorUids);
  return useQuery({
    queryKey: deedPostsQueryKeys.authorPics(key || '__none__'),
    queryFn: () => fetchProfilePicUrlsForUids(unique),
    enabled: unique.length > 0,
    staleTime: 60_000,
  });
}
