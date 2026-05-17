import { useState } from 'react';
import { Alert, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';

import { YesNoRow } from '@/features/settings/components/SettingsRows';
import { useClearAllTaskPhotosMutation } from '@/features/tasks/hooks/useTasksQueries';
import { useMergeActsSettingsMutation } from '@/features/user-profile/hooks/useUserInfoMutations';
import { useUserInfoQuery } from '@/features/user-profile/hooks/useUserInfoQuery';
import { mergeActsDefaults } from '@/shared/types/actsSettings';
import { AppButton, AppText, Screen } from '@/shared/components/ui';
import { useAuthStore } from '@/shared/stores/authStore';

export default function SettingsPhotosScreen() {
  const uid = useAuthStore((s) => s.user?.uid);
  const { data: userInfo } = useUserInfoQuery(uid);
  const mutation = useMergeActsSettingsMutation(uid);
  const clearAll = useClearAllTaskPhotosMutation(uid);
  const base = mergeActsDefaults(userInfo?.ActsSettings);
  const [clearBusy, setClearBusy] = useState(false);

  const confirmDeleteAll = () => {
    Alert.alert(
      'Delete all photos?',
      'Removes photos from your acts and storage.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete all',
          style: 'destructive',
          onPress: () => {
            setClearBusy(true);
            clearAll.mutate(undefined, {
              onSettled: () => setClearBusy(false),
              onError: (e) => Alert.alert('Could not delete', e instanceof Error ? e.message : 'Try again'),
            });
          },
        },
      ],
    );
  };

  return (
    <Screen scroll>
      <View className="items-center pb-8 pt-2">
        <View className="mb-4 flex-row items-center justify-center gap-2">
          <Ionicons name="settings-outline" size={32} color="#2D1528" />
          <Ionicons name="heart" size={28} color="#E11D74" />
        </View>
        <AppText variant="title" className="mb-6">
          Photos
        </AppText>
        <View className="w-full">
          <YesNoRow
            label="Autosave Photos"
            value={base.autosavePhotos}
            onPick={(v) => void mutation.mutateAsync({ autosavePhotos: v })}
            disabled={mutation.isPending}
          />
        </View>
        <AppButton
          title="Delete all photos from this account"
          variant="secondary"
          loading={clearBusy || clearAll.isPending}
          disabled={clearBusy || clearAll.isPending}
          onPress={confirmDeleteAll}
          className="mt-6 border-acts-danger/40 bg-acts-danger/10"
        />
      </View>
    </Screen>
  );
}
