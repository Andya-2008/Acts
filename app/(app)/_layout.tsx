import { Redirect, Stack } from 'expo-router';

import { ActAppearanceProvider } from '@/shared/providers/ActAppearanceProvider';
import { useAuthStore } from '@/shared/stores/authStore';

export default function AppGroupLayout() {
  const user = useAuthStore((s) => s.user);
  const authReady = useAuthStore((s) => s.authReady);

  if (authReady && !user) {
    return <Redirect href="/(auth)/login" />;
  }

  return (
    <ActAppearanceProvider>
      <Stack screenOptions={{ headerShown: false, animation: 'fade' }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="personalization-choice" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen
          name="become"
          options={{
            headerShown: true,
            title: 'Become',
            animation: 'slide_from_right',
          }}
        />
        <Stack.Screen name="settings" />
        <Stack.Screen name="profile" />
      </Stack>
    </ActAppearanceProvider>
  );
}
