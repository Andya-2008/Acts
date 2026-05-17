import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { deedPostsQueryKeys } from '@/features/deed-feed/queryKeys';
import {
  addDeedComment,
  deleteDeedComment,
  fetchCommentsByPostIds,
} from '@/features/deed-feed/services/deedCommentRepository';

function postIdsKey(postIds: string[]): string {
  return [...postIds].sort().join(',');
}

export function useDeedPostCommentsQuery(viewerUid: string | undefined, postIds: string[]) {
  const key = postIdsKey(postIds);
  return useQuery({
    queryKey: viewerUid ? deedPostsQueryKeys.comments(viewerUid, key) : [...deedPostsQueryKeys.all, '__comments_none__'],
    queryFn: () => fetchCommentsByPostIds(postIds),
    enabled: Boolean(viewerUid) && postIds.length > 0,
    staleTime: 10_000,
  });
}

export function useAddDeedCommentMutation(viewerUid: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ postId, text }: { postId: string; text: string }) => addDeedComment(postId, viewerUid!, text),
    onSuccess: async () => {
      if (!viewerUid) {
        return;
      }
      await qc.invalidateQueries({ queryKey: [...deedPostsQueryKeys.all, 'comments', viewerUid] });
    },
  });
}

export function useDeleteDeedCommentMutation(viewerUid: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ postId, commentId }: { postId: string; commentId: string }) =>
      deleteDeedComment(postId, commentId, viewerUid!),
    onSuccess: async () => {
      if (!viewerUid) {
        return;
      }
      await qc.invalidateQueries({ queryKey: [...deedPostsQueryKeys.all, 'comments', viewerUid] });
    },
  });
}
