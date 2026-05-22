import { Redirect, Stack } from 'expo-router';

import { FriendsGateGuard } from '@/features/friends/components/FriendsGateGuard';
import { NotificationNavigationSync } from '@/features/notifications/NotificationNavigationSync';
import { RetentionNotificationsSync } from '@/features/retention/RetentionNotificationsSync';
import { HeaderBackLabel } from '@/shared/components/HeaderBackLabel';
import { useActAppearance } from '@/shared/providers/ActAppearanceProvider';
import { useAuthStore } from '@/shared/stores/authStore';

function AppStackScreens() {
  const act = useActAppearance();
  const lightHeader = {
    headerShadowVisible: false as const,
    headerStyle: { backgroundColor: act.palette.canvas },
    headerTintColor: act.palette.ink,
    headerTitleStyle: { color: act.palette.ink, fontWeight: '700' as const },
  };

  return (
    <Stack screenOptions={{ headerShown: false, animation: 'fade' }}>
      <Stack.Screen name="index" />
      <Stack.Screen
        name="friends-get-started"
        options={{ headerShown: false, gestureEnabled: false, animation: 'fade' }}
      />
      <Stack.Screen name="personalization-choice" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="settings" />
      <Stack.Screen name="profile" />
      <Stack.Screen
        name="shop"
        options={{
          ...lightHeader,
          headerShown: true,
          title: 'Kindness Arcade',
          headerBackVisible: false,
          headerLeft: () => <HeaderBackLabel />,
          animation: 'slide_from_right',
        }}
      />
      <Stack.Screen
        name="achievements"
        options={{
          ...lightHeader,
          headerShown: false,
          animation: 'slide_from_right',
        }}
      />
    </Stack>
  );
}

export default function AppGroupLayout() {
  const user = useAuthStore((s) => s.user);
  const authReady = useAuthStore((s) => s.authReady);

  if (authReady && !user) {
    return <Redirect href="/(auth)/login" />;
  }

  return (
    <>
      <RetentionNotificationsSync />
      <NotificationNavigationSync />
      <FriendsGateGuard>
        <AppStackScreens />
      </FriendsGateGuard>
    </>
  );
}
