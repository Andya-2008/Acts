import { useEffect, useState } from 'react';
import { Modal, Pressable, View } from 'react-native';

import { AppButton, AppText, AppTextField } from '@/shared/components/ui';
import { useReduceMotion } from '@/shared/hooks/useReduceMotion';
import { modalAnimationType } from '@/shared/utils/accessibilityMotion';

type ChangePasswordModalProps = {
  visible: boolean;
  busy: boolean;
  errorMessage: string | null;
  onClose: () => void;
  onSubmit: (input: { currentPassword: string; newPassword: string }) => void;
};

export function ChangePasswordModal({
  visible,
  busy,
  errorMessage,
  onClose,
  onSubmit,
}: ChangePasswordModalProps) {
  const reduceMotion = useReduceMotion();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    if (!visible) {
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    }
  }, [visible]);

  const newPasswordValid = newPassword.length >= 8;
  const passwordsMatch = newPassword === confirmPassword;
  const canSubmit =
    currentPassword.length > 0 &&
    newPasswordValid &&
    confirmPassword.length > 0 &&
    passwordsMatch &&
    newPassword !== currentPassword;

  return (
    <Modal
      visible={visible}
      animationType={modalAnimationType(reduceMotion, 'slide')}
      transparent
      onRequestClose={onClose}>
      <View className="flex-1 justify-end">
        <Pressable
          className="absolute bottom-0 left-0 right-0 top-0 bg-black/40"
          onPress={busy ? undefined : onClose}
          accessibilityLabel="Dismiss change password"
        />
        <View className="rounded-t-3xl bg-acts-canvas px-5 pb-8 pt-4">
          <AppText variant="title" className="mb-2 text-acts-ink">
            Change password
          </AppText>
          <AppText variant="body" className="mb-4 leading-6 text-acts-muted">
            Enter your current password, then choose a new one with at least 8 characters.
          </AppText>
          <AppTextField
            label="Current password"
            value={currentPassword}
            onChangeText={setCurrentPassword}
            secureTextEntry
            editable={!busy}
            placeholder="Current password"
          />
          <AppTextField
            label="New password"
            value={newPassword}
            onChangeText={setNewPassword}
            secureTextEntry
            editable={!busy}
            placeholder="At least 8 characters"
            errorMessage={
              newPassword.length > 0 && !newPasswordValid ? 'Use at least 8 characters.' : undefined
            }
          />
          <AppTextField
            label="Confirm new password"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
            editable={!busy}
            placeholder="Re-enter new password"
            errorMessage={
              confirmPassword.length > 0 && !passwordsMatch ? 'Passwords do not match.' : undefined
            }
          />
          {errorMessage ? (
            <AppText variant="caption" className="mb-3 text-acts-danger">
              {errorMessage}
            </AppText>
          ) : null}
          <View className="mt-2 flex-row gap-3">
            <AppButton title="Cancel" variant="secondary" className="flex-1" disabled={busy} onPress={onClose} />
            <AppButton
              title="Update password"
              className="flex-1"
              loading={busy}
              disabled={busy || !canSubmit}
              onPress={() => onSubmit({ currentPassword, newPassword })}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}
