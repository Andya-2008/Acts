import Ionicons from '@expo/vector-icons/Ionicons';
import type { User } from 'firebase/auth';
import { Modal, Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, type Href } from 'expo-router';

import { AppButton, AppText } from '@/shared/components/ui';

type ProfileSettingsMenuProps = {
  visible: boolean;
  onClose: () => void;
  user: User | null;
  becomeTitle: string | null;
  deleteBusy: boolean;
  deleteError: string | null;
  onLogout: () => void;
  onConfirmDeleteAccount: () => void;
};

export function ProfileSettingsMenu({
  visible,
  onClose,
  user,
  becomeTitle,
  deleteBusy,
  deleteError,
  onLogout,
  onConfirmDeleteAccount,
}: ProfileSettingsMenuProps) {
  const insets = useSafeAreaInsets();
  const top = Math.max(insets.top, 12) + 8;

  const goSettings = () => {
    onClose();
    router.push('/(app)/settings' as Href);
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View className="flex-1">
        <Pressable className="absolute inset-0 bg-acts-ink/40" onPress={onClose} accessibilityLabel="Close settings" />
        <View
          className="absolute max-w-[90%] rounded-3xl border border-acts-border/60 bg-acts-surface p-4 shadow-xl"
          style={{ top, right: 16, width: 300 }}>
          <View className="mb-3 flex-row items-center justify-between">
            <AppText variant="subtitle">Settings</AppText>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Close"
              hitSlop={10}
              onPress={onClose}
              className="rounded-full bg-acts-green-soft/80 p-1.5 active:opacity-70">
              <Ionicons name="close" size={22} color="#2D1528" />
            </Pressable>
          </View>

          <AppText variant="caption" className="mb-3 text-acts-muted">
            {user?.email ?? ''}
          </AppText>

          <AppButton title="Open full settings" onPress={goSettings} className="mb-4" />

          <View className="mb-4 rounded-2xl bg-acts-canvas px-3 py-3">
            <AppText variant="label" className="mb-1">
              Become
            </AppText>
            <AppText variant="body" className="mb-3">
              {becomeTitle ?? 'Not set'}
            </AppText>
            <AppButton
              title="Open Become"
              variant="secondary"
              className="py-3"
              onPress={() => {
                onClose();
                router.push('/(app)/become');
              }}
            />
          </View>

          {__DEV__ ? (
            <View className="mb-4 rounded-2xl border border-acts-danger/40 bg-acts-danger/5 px-3 py-3">
              <AppText variant="label" className="mb-2 text-acts-danger">
                Developer
              </AppText>
              {deleteError ? (
                <AppText variant="caption" className="mb-2 text-acts-danger">
                  {deleteError}
                </AppText>
              ) : null}
              <AppButton
                title="Delete account (dev)"
                variant="dangerOutline"
                loading={deleteBusy}
                disabled={deleteBusy}
                onPress={onConfirmDeleteAccount}
                className="py-3"
              />
            </View>
          ) : null}

          <AppButton title="Log out" variant="secondary" className="py-3.5" onPress={onLogout} />
        </View>
      </View>
    </Modal>
  );
}
