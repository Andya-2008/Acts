import { Linking, Modal, Pressable, View } from 'react-native';

import type { AppStoreUpdateOffer } from '@/features/app-update/useAppStoreUpdate';
import { AppButton, AppText } from '@/shared/components/ui';
import { useReduceMotion } from '@/shared/hooks/useReduceMotion';
import { modalAnimationType } from '@/shared/utils/accessibilityMotion';

type AppStoreUpdateModalProps = {
  offer: AppStoreUpdateOffer;
  onDismiss: () => void;
};

export function AppStoreUpdateModal({ offer, onDismiss }: AppStoreUpdateModalProps) {
  const reduceMotion = useReduceMotion();

  const openStore = () => {
    void Linking.openURL(offer.storeUrl).catch(() => {
      /* user can retry from the modal */
    });
  };

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
            Update available
          </AppText>
          <AppText variant="body" className="mb-5 text-center leading-6 text-acts-muted">
            A new version of Acts ({offer.latestVersion}) is on the App Store. Update to get the latest fixes and
            features.
          </AppText>
          <AppText variant="caption" className="mb-5 text-center text-acts-muted">
            You are on v{offer.currentVersion}
          </AppText>
          <AppButton title="Update on the App Store" className="mb-3" onPress={openStore} />
          <AppButton title="Not now" variant="secondary" onPress={onDismiss} />
        </View>
      </View>
    </Modal>
  );
}
