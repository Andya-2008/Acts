import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { deedPostsQueryKeys } from '@/features/deed-feed/queryKeys';
import {
  clearDeedReaction,
  fetchReactionSummariesForPostIds,
  setDeedReaction,
} from '@/features/deed-feed/services/deedReactionRepository';
import type { DeedReactionKind } from '@/shared/types/deedReaction';

function postIdsKey(postIds: string[]): string {
  return [...postIds].sort().join(',');
}

export function useDeedPostReactionsQuery(viewerUid: string | undefined, postIds: string[]) {
  const key = postIdsKey(postIds);
  return useQuery({
    queryKey: viewerUid ? deedPostsQueryKeys.reactions(viewerUid, key) : [...deedPostsQueryKeys.all, '__reactions_none__'],
    queryFn: () => fetchReactionSummariesForPostIds(postIds, viewerUid!),
    enabled: Boolean(viewerUid) && postIds.length > 0,
    staleTime: 10_000,
  });
}

export function useSetDeedReactionMutation(viewerUid: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ postId, kind }: { postId: string; kind: DeedReactionKind | null }) => {
      if (!viewerUid) {
        throw new Error('Not signed in');
      }
      if (kind == null) {
        await clearDeedReaction(viewerUid, postId);
      } else {
        await setDeedReaction(viewerUid, postId, kind);
      }
    },
    onSuccess: async () => {
      if (!viewerUid) {
        return;
      }
      await qc.invalidateQueries({ queryKey: [...deedPostsQueryKeys.all, 'reactions', viewerUid] });
    },
  });
}
