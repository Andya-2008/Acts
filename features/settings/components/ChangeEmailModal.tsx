import { useEffect, useState } from 'react';
import { Modal, Pressable, View } from 'react-native';

import { AppButton, AppText, AppTextField } from '@/shared/components/ui';
import { useReduceMotion } from '@/shared/hooks/useReduceMotion';
import { modalAnimationType } from '@/shared/utils/accessibilityMotion';

type ChangeEmailModalProps = {
  visible: boolean;
  currentEmail: string;
  busy: boolean;
  errorMessage: string | null;
  onClose: () => void;
  onSubmit: (input: { newEmail: string; password: string }) => void;
};

export function ChangeEmailModal({
  visible,
  currentEmail,
  busy,
  errorMessage,
  onClose,
  onSubmit,
}: ChangeEmailModalProps) {
  const reduceMotion = useReduceMotion();
  const [newEmail, setNewEmail] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
    if (!visible) {
      setNewEmail('');
      setPassword('');
    }
  }, [visible]);

  const trimmed = newEmail.trim().toLowerCase();
  const emailLooksValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed);
  const canSubmit =
    emailLooksValid && trimmed !== currentEmail.trim().toLowerCase() && password.length > 0;

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
          accessibilityLabel="Dismiss change email"
        />
        <View className="rounded-t-3xl bg-acts-canvas px-5 pb-8 pt-4">
          <AppText variant="title" className="mb-2 text-acts-ink">
            Change email
          </AppText>
          <AppText variant="body" className="mb-4 leading-6 text-acts-muted">
            We will send a verification link to your new address. Your sign-in email updates only after you tap that
            link. Until then, keep using {currentEmail}.
          </AppText>
          <AppTextField label="Current email" value={currentEmail} editable={false} />
          <AppTextField
            label="New email"
            value={newEmail}
            onChangeText={setNewEmail}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            editable={!busy}
            placeholder="you@example.com"
            errorMessage={
              newEmail.length > 0 && !emailLooksValid ? 'Enter a valid email address.' : undefined
            }
          />
          <AppTextField
            label="Current password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            editable={!busy}
            placeholder="Confirm it is you"
          />
          {errorMessage ? (
            <AppText variant="caption" className="mb-3 text-acts-danger">
              {errorMessage}
            </AppText>
          ) : null}
          <View className="mt-2 flex-row gap-3">
            <AppButton title="Cancel" variant="secondary" className="flex-1" disabled={busy} onPress={onClose} />
            <AppButton
              title="Send verification"
              className="flex-1"
              loading={busy}
              disabled={busy || !canSubmit}
              onPress={() => onSubmit({ newEmail: trimmed, password })}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}
