import { useEffect, useMemo, useState } from 'react';
import { Modal, Pressable, View } from 'react-native';

import { AppButton, AppText, AppTextField } from '@/shared/components/ui';
import { useReduceMotion } from '@/shared/hooks/useReduceMotion';
import { modalAnimationType } from '@/shared/utils/accessibilityMotion';
import { normalizeUsernameKey } from '@/shared/utils/usernameKey';

type DeleteAccountConfirmModalProps = {
  visible: boolean;
  username: string;
  busy: boolean;
  onClose: () => void;
  onConfirmDelete: () => void;
};

export function DeleteAccountConfirmModal({
  visible,
  username,
  busy,
  onClose,
  onConfirmDelete,
}: DeleteAccountConfirmModalProps) {
  const reduceMotion = useReduceMotion();
  const [typed, setTyped] = useState('');

  useEffect(() => {
    if (!visible) {
      setTyped('');
    }
  }, [visible]);

  const usernameMatches = useMemo(() => {
    if (!username.trim()) {
      return false;
    }
    return normalizeUsernameKey(typed) === normalizeUsernameKey(username);
  }, [typed, username]);

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
          accessibilityLabel="Dismiss delete confirmation"
        />
        <View className="rounded-t-3xl bg-acts-canvas px-5 pb-8 pt-4">
          <AppText variant="title" className="mb-2 text-acts-danger">
            Delete your account?
          </AppText>
          <AppText variant="body" className="mb-4 leading-6 text-acts-muted">
            This permanently removes your Acts profile, tasks, friends, deed posts, photos, and sign-in. You will be
            logged out. This cannot be undone.
          </AppText>
          <AppText variant="body" className="mb-3 leading-6 text-acts-ink">
            Type your username{' '}
            <AppText variant="body" className="font-semibold text-acts-ink">
              {username}
            </AppText>{' '}
            below to confirm.
          </AppText>
          <AppTextField
            label="Username"
            value={typed}
            onChangeText={setTyped}
            autoCapitalize="none"
            autoCorrect={false}
            editable={!busy}
            placeholder={username}
          />
          <View className="mt-2 flex-row gap-3">
            <AppButton
              title="Cancel"
              variant="secondary"
              className="flex-1"
              disabled={busy}
              accessibilityLabel="Cancel account deletion"
              onPress={onClose}
            />
            <AppButton
              title="Delete my account"
              variant="dangerOutline"
              className="flex-1"
              loading={busy}
              disabled={busy || !usernameMatches}
              accessibilityLabel="Permanently delete my account"
              onPress={onConfirmDelete}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}
