import { useMutation, useQueryClient } from '@tanstack/react-query';

import { deedPostsQueryKeys } from '@/features/deed-feed/queryKeys';
import { mergeActsSettings, updateUserProfileBasics } from '@/features/user-profile/services/userInfoRepository';
import { saveProfilePhotoFromLocalUri } from '@/features/user-profile/services/profilePhotoRepository';
import { userInfoQueryKeys } from '@/features/user-profile/queryKeys';
import type { ActsAppSettings } from '@/shared/types/actsSettings';

export function useMergeActsSettingsMutation(uid: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (patch: Partial<ActsAppSettings>) => {
      if (!uid) {
        throw new Error('Not signed in');
      }
      await mergeActsSettings(uid, patch);
    },
    onSuccess: async () => {
      if (uid) {
        await qc.invalidateQueries({ queryKey: userInfoQueryKeys.detail(uid) });
      }
    },
  });
}

export function useUpdateUserProfileBasicsMutation(uid: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (fields: { First?: string; Last?: string; Phone?: string; DOB?: string }) => {
      if (!uid) {
        throw new Error('Not signed in');
      }
      await updateUserProfileBasics(uid, fields);
    },
    onSuccess: async () => {
      if (uid) {
        await qc.invalidateQueries({ queryKey: userInfoQueryKeys.detail(uid) });
      }
    },
  });
}

export function useSaveProfilePictureMutation(uid: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (localUri: string) => {
      if (!uid) {
        throw new Error('Not signed in');
      }
      return saveProfilePhotoFromLocalUri(uid, localUri);
    },
    onSuccess: async () => {
      if (uid) {
        await qc.invalidateQueries({ queryKey: userInfoQueryKeys.detail(uid) });
      }
      await qc.invalidateQueries({ queryKey: [...deedPostsQueryKeys.all, 'authorPics'] });
    },
  });
}
