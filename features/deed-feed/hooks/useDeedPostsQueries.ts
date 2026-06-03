import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { deedPostsQueryKeys } from '@/features/deed-feed/queryKeys';
import {
  createDeedPostWithPhoto,
  deleteDeedPostForViewer,
  fetchFriendsDeedPosts,
  fetchMyDeedPosts,
  fetchUserDeedPosts,
  updateDeedPostAuthorSettings,
  updateDeedPostCardTint,
  type DeedPostAuthorSettingsPatch,
} from '@/features/deed-feed/services/deedPostRepository';
import type { DeedCardTintId } from '@/shared/constants/deedPostCardTints';
import { tasksQueryKeys } from '@/features/tasks/queryKeys';

export type CreateDeedPostMutationVariables = {
  uid: string;
  authorDisplayName: string;
  authorProfilePicUrl?: string | null;
  caption: string;
  photoSourceUri: string;
  sourceTaskId?: string;
};

export function useFriendsDeedPostsQuery(uid: string | undefined, friendUids: string[], friendsListReady: boolean) {
  const friendsSortedKey = [...friendUids].sort().join('|');
  return useQuery({
    queryKey: uid ? deedPostsQueryKeys.friends(uid, friendsSortedKey) : [...deedPostsQueryKeys.all, '__none__'],
    queryFn: () => (friendUids.length === 0 ? Promise.resolve([]) : fetchFriendsDeedPosts(friendUids, 40)),
    enabled: Boolean(uid) && friendsListReady,
    staleTime: 15_000,
  });
}

export function useMyDeedPostsQuery(uid: string | undefined) {
  return useQuery({
    queryKey: uid ? deedPostsQueryKeys.mine(uid) : [...deedPostsQueryKeys.all, '__mine_none__'],
    queryFn: () => fetchMyDeedPosts(uid!, 30),
    enabled: Boolean(uid),
    staleTime: 15_000,
  });
}

/** Deed posts authored by `authorUid` — used for the memories grid on a profile. */
export function useUserDeedPostsQuery(authorUid: string | undefined, enabled = true) {
  return useQuery({
    queryKey: authorUid
      ? deedPostsQueryKeys.byUser(authorUid)
      : [...deedPostsQueryKeys.all, '__byuser_none__'],
    queryFn: () => fetchUserDeedPosts(authorUid!, 30),
    enabled: Boolean(authorUid) && enabled,
    staleTime: 30_000,
  });
}

export function useCreateDeedPostMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateDeedPostMutationVariables) => createDeedPostWithPhoto(input),
    onSuccess: async (_postId, vars) => {
      await qc.invalidateQueries({ queryKey: deedPostsQueryKeys.all });
      await qc.invalidateQueries({ queryKey: tasksQueryKeys.list(vars.uid) });
    },
  });
}

export function useDeleteDeedPostMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ uid, postId }: { uid: string; postId: string }) => deleteDeedPostForViewer(uid, postId),
    onSuccess: async (_void, { uid }) => {
      await qc.invalidateQueries({ queryKey: deedPostsQueryKeys.all });
      await qc.invalidateQueries({ queryKey: tasksQueryKeys.list(uid) });
    },
  });
}

export function useUpdateDeedPostAuthorSettingsMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      uid,
      postId,
      patch,
    }: {
      uid: string;
      postId: string;
      patch: DeedPostAuthorSettingsPatch;
    }) => updateDeedPostAuthorSettings(uid, postId, patch),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: deedPostsQueryKeys.all });
    },
  });
}

export function useUpdateDeedPostCardTintMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      uid,
      postId,
      cardTintId,
    }: {
      uid: string;
      postId: string;
      cardTintId: DeedCardTintId | null;
    }) => updateDeedPostCardTint(uid, postId, cardTintId),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: deedPostsQueryKeys.all });
    },
  });
}
