import { useMutation, useQueryClient } from '@tanstack/react-query';

import { changeUsernameForUser } from '@/features/auth/services/accountCredentialsService';
import { changePasswordForUser, requestVerifiedEmailChange } from '@/features/auth/services/reauthenticateUser';
import { userInfoQueryKeys } from '@/features/user-profile/queryKeys';

export function useChangeUsernameMutation(uid: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { newUsername: string; password?: string; currentEmail?: string }) => {
      if (!uid) {
        throw new Error('Not signed in');
      }
      return changeUsernameForUser(uid, input.newUsername, {
        password: input.password,
        currentEmail: input.currentEmail,
      });
    },
    onSuccess: async () => {
      if (uid) {
        await qc.invalidateQueries({ queryKey: userInfoQueryKeys.detail(uid) });
      }
    },
  });
}

export function useRequestEmailChangeMutation() {
  return useMutation({
    mutationFn: async (input: { newEmail: string; password: string }) => {
      await requestVerifiedEmailChange(input.newEmail, input.password);
    },
  });
}

export function useChangePasswordMutation() {
  return useMutation({
    mutationFn: async (input: { currentPassword: string; newPassword: string }) => {
      await changePasswordForUser(input.currentPassword, input.newPassword);
    },
  });
}
