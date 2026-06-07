import { useEffect, useState } from 'react';
import { Modal, Pressable, View } from 'react-native';

import { usernameSchema } from '@/features/auth/validation/authSchemas';
import { AppButton, AppText, AppTextField } from '@/shared/components/ui';
import { useReduceMotion } from '@/shared/hooks/useReduceMotion';
import { modalAnimationType } from '@/shared/utils/accessibilityMotion';

type ChangeUsernameModalProps = {
  visible: boolean;
  currentUsername: string;
  requiresPassword: boolean;
  busy: boolean;
  errorMessage: string | null;
  onClose: () => void;
  onSubmit: (input: { newUsername: string; password?: string }) => void;
};

export function ChangeUsernameModal({
  visible,
  currentUsername,
  requiresPassword,
  busy,
  errorMessage,
  onClose,
  onSubmit,
}: ChangeUsernameModalProps) {
  const reduceMotion = useReduceMotion();
  const [newUsername, setNewUsername] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
    if (!visible) {
      setNewUsername('');
      setPassword('');
    }
  }, [visible]);

  const localValidation = usernameSchema.safeParse(newUsername.trim());
  const canSubmit =
    localValidation.success &&
    newUsername.trim().toLowerCase() !== currentUsername.trim().toLowerCase() &&
    (!requiresPassword || password.length > 0);

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
          accessibilityLabel="Dismiss change username"
        />
        <View className="rounded-t-3xl bg-acts-canvas px-5 pb-8 pt-4">
          <AppText variant="title" className="mb-2 text-acts-ink">
            Change username
          </AppText>
          <AppText variant="body" className="mb-4 leading-6 text-acts-muted">
            Usernames are public. Friends can find you by your new username after you save.
          </AppText>
          <AppTextField label="Current username" value={currentUsername} editable={false} />
          <AppTextField
            label="New username"
            value={newUsername}
            onChangeText={setNewUsername}
            autoCapitalize="none"
            autoCorrect={false}
            editable={!busy}
            placeholder="letters, numbers, underscores"
            errorMessage={
              newUsername.length > 0 && !localValidation.success
                ? localValidation.error.issues[0]?.message
                : undefined
            }
          />
          {requiresPassword ? (
            <AppTextField
              label="Current password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              editable={!busy}
              placeholder="Confirm it is you"
            />
          ) : null}
          {errorMessage ? (
            <AppText variant="caption" className="mb-3 text-acts-danger">
              {errorMessage}
            </AppText>
          ) : null}
          <View className="mt-2 flex-row gap-3">
            <AppButton title="Cancel" variant="secondary" className="flex-1" disabled={busy} onPress={onClose} />
            <AppButton
              title="Save username"
              className="flex-1"
              loading={busy}
              disabled={busy || !canSubmit}
              onPress={() =>
                onSubmit({
                  newUsername: newUsername.trim(),
                  password: requiresPassword ? password : undefined,
                })
              }
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}
