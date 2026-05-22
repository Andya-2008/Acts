import { useMutation, useQueryClient } from '@tanstack/react-query';

import { deedPostsQueryKeys } from '@/features/deed-feed/queryKeys';
import { friendsQueryKeys } from '@/features/friends/queryKeys';
import { blockUser, submitDeedReport, unblockUser } from '@/features/safety/safetyRepository';
import { userInfoQueryKeys } from '@/features/user-profile/queryKeys';

export function useBlockUserMutation(viewerUid: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (blockedUid: string) => {
      if (!viewerUid) {
        throw new Error('Not signed in');
      }
      return blockUser(viewerUid, blockedUid);
    },
    onSuccess: async () => {
      if (!viewerUid) {
        return;
      }
      await qc.invalidateQueries({ queryKey: userInfoQueryKeys.detail(viewerUid) });
      await qc.invalidateQueries({ queryKey: deedPostsQueryKeys.all });
      await qc.invalidateQueries({ queryKey: friendsQueryKeys.all });
    },
  });
}

export function useUnblockUserMutation(viewerUid: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (blockedUid: string) => {
      if (!viewerUid) {
        throw new Error('Not signed in');
      }
      return unblockUser(viewerUid, blockedUid);
    },
    onSuccess: async () => {
      if (!viewerUid) {
        return;
      }
      await qc.invalidateQueries({ queryKey: userInfoQueryKeys.detail(viewerUid) });
      await qc.invalidateQueries({ queryKey: deedPostsQueryKeys.all });
      await qc.invalidateQueries({ queryKey: friendsQueryKeys.all });
    },
  });
}

export function useSubmitDeedReportMutation() {
  return useMutation({
    mutationFn: submitDeedReport,
  });
}
