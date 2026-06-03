import { Stack } from 'expo-router';
import { View } from 'react-native';

import { MyDeedsList } from '@/features/deed-feed/components/MyDeedsList';
import { HeaderBackLabel } from '@/shared/components/HeaderBackLabel';
import { stackHeaderChrome } from '@/shared/navigation/stackHeaderChrome';
import { AppText, Screen } from '@/shared/components/ui';
import { useActAppearance } from '@/shared/providers/ActAppearanceProvider';
import { useAuthStore } from '@/shared/stores/authStore';

/** Your shared deeds with full management (card options, remove), opened from the deed feed "Your deeds" button. */
export default function MyMemoriesScreen() {
  const act = useActAppearance();
  const uid = useAuthStore((s) => s.user?.uid);

  const headerOptions = {
    ...stackHeaderChrome(act),
    headerShown: true as const,
    title: 'Your deeds',
    headerLeft: () => <HeaderBackLabel />,
  };

  return (
    <>
      <Stack.Screen options={headerOptions} />
      <Screen scroll>
        <View className="pt-1 pb-8">
          {uid ? (
            <MyDeedsList uid={uid} />
          ) : (
            <AppText variant="body" className="text-acts-muted">
              Sign in to see your deeds.
            </AppText>
          )}
        </View>
      </Screen>
    </>
  );
}
