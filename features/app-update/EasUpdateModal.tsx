import { Modal, Pressable, View } from 'react-native';

import { AppButton, AppText } from '@/shared/components/ui';
import { useReduceMotion } from '@/shared/hooks/useReduceMotion';
import { modalAnimationType } from '@/shared/utils/accessibilityMotion';

type EasUpdateModalProps = {
  onApply: () => void;
  onDismiss: () => void;
  applying?: boolean;
};

export function EasUpdateModal({ onApply, onDismiss, applying = false }: EasUpdateModalProps) {
  const reduceMotion = useReduceMotion();

  return (
    <Modal
      visible
      animationType={modalAnimationType(reduceMotion, 'fade')}
      transparent
      onRequestClose={onDismiss}>
      <View className="flex-1 items-center justify-center px-6">
        <Pressable
          className="absolute bottom-0 left-0 right-0 top-0 bg-black/45"
          onPress={onDismiss}
          accessibilityLabel="Dismiss update message"
        />
        <View className="w-full max-w-sm rounded-3xl bg-acts-canvas px-5 py-6">
          <AppText variant="title" className="mb-2 text-center text-acts-ink">
            Update ready
          </AppText>
          <AppText variant="body" className="mb-5 text-center leading-6 text-acts-muted">
            A quick improvement is ready. Restart Acts to apply the latest fixes — no App Store download
            needed.
          </AppText>
          <AppButton
            title="Restart now"
            className="mb-3"
            loading={applying}
            disabled={applying}
            onPress={onApply}
          />
          <AppButton title="Not now" variant="secondary" disabled={applying} onPress={onDismiss} />
        </View>
      </View>
    </Modal>
  );
}
