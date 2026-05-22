import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { deedPostsQueryKeys } from '@/features/deed-feed/queryKeys';
import {
  clearDeedReaction,
  fetchReactionSummariesForPostIds,
  setDeedReaction,
} from '@/features/deed-feed/services/deedReactionRepository';
import { emptyDeedReactionSummary } from '@/shared/constants/deedReactions';
import type { DeedReactionKind, DeedReactionSummary } from '@/shared/types/deedReaction';

function postIdsKey(postIds: string[]): string {
  return [...postIds].sort().join(',');
}

function applyReactionToggle(
  summaries: Record<string, DeedReactionSummary> | undefined,
  postId: string,
  _viewerUid: string,
  next: DeedReactionKind | null,
): Record<string, DeedReactionSummary> | undefined {
  const prev = summaries?.[postId] ?? emptyDeedReactionSummary();
  const counts = { ...prev.counts };
  if (prev.mine) {
    counts[prev.mine] = Math.max(0, (counts[prev.mine] ?? 0) - 1);
  }
  if (next) {
    counts[next] = (counts[next] ?? 0) + 1;
  }
  return {
    ...(summaries ?? {}),
    [postId]: { counts, mine: next },
  };
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
    onMutate: async ({ postId, kind: nextKind }) => {
      if (!viewerUid) {
        return;
      }
      await qc.cancelQueries({ queryKey: [...deedPostsQueryKeys.all, 'reactions', viewerUid] });
      const snapshots = qc.getQueriesData<Record<string, DeedReactionSummary>>({
        queryKey: [...deedPostsQueryKeys.all, 'reactions', viewerUid],
      });
      for (const [queryKey, data] of snapshots) {
        if (!data) {
          continue;
        }
        qc.setQueryData(queryKey, applyReactionToggle(data, postId, viewerUid, nextKind));
      }
      return { snapshots };
    },
    onError: (_err, _vars, context) => {
      if (!context?.snapshots) {
        return;
      }
      for (const [queryKey, data] of context.snapshots) {
        qc.setQueryData(queryKey, data);
      }
    },
    onSettled: async () => {
      if (!viewerUid) {
        return;
      }
      await qc.invalidateQueries({ queryKey: [...deedPostsQueryKeys.all, 'reactions', viewerUid] });
    },
  });
}
