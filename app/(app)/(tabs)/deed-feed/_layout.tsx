import { Stack } from 'expo-router';

import { stackHeaderChrome } from '@/shared/navigation/stackHeaderChrome';
import { useActAppearance } from '@/shared/providers/ActAppearanceProvider';

export default function DeedFeedLayout() {
  const act = useActAppearance();

  return (
    <Stack screenOptions={{ ...stackHeaderChrome(act), headerShown: true }}>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="friends" options={{ headerShown: false }} />
    </Stack>
  );
}
