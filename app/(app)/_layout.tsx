import { Redirect, Stack } from 'expo-router';

import { FriendsGateGuard } from '@/features/friends/components/FriendsGateGuard';
import { InviteJoinAlertModal } from '@/features/friends/components/InviteJoinAlertModal';
import { ActivityNotificationsSync } from '@/features/notifications/ActivityNotificationsSync';
import { ExpoPushTokenSync } from '@/features/notifications/ExpoPushTokenSync';
import { LeaderboardNotificationsSync } from '@/features/leaderboards/LeaderboardNotificationsSync';
import { SeasonNotificationsSync } from '@/features/challenges/SeasonNotificationsSync';
import { NotificationBadgeSync } from '@/features/notifications/components/NotificationBadgeSync';
import { NotificationNavigationSync } from '@/features/notifications/NotificationNavigationSync';
import { RetentionNotificationsSync } from '@/features/retention/RetentionNotificationsSync';
import { WidgetSync } from '@/features/widgets/WidgetSync';
import { HeaderBackLabel } from '@/shared/components/HeaderBackLabel';
import { stackHeaderChrome } from '@/shared/navigation/stackHeaderChrome';
import { useActAppearance } from '@/shared/providers/ActAppearanceProvider';
import { useAuthStore } from '@/shared/stores/authStore';

function AppStackScreens() {
  const act = useActAppearance();
  const lightHeader = stackHeaderChrome(act);

  return (
    <Stack screenOptions={{ headerShown: false, animation: 'fade' }}>
      <Stack.Screen name="index" />
      <Stack.Screen
        name="friends-get-started"
        options={{ headerShown: false, gestureEnabled: false, animation: 'fade' }}
      />
      <Stack.Screen name="personalization-choice" />
      <Stack.Screen
        name="my-memories"
        options={{ ...lightHeader, headerShown: false, animation: 'slide_from_right' }}
      />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="settings" />
      <Stack.Screen name="profile" />
      <Stack.Screen
        name="shop"
        options={{
          ...lightHeader,
          headerShown: true,
          title: 'Rewards',
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
      <Stack.Screen
        name="leaderboards"
        options={{
          ...lightHeader,
          headerShown: false,
          animation: 'slide_from_right',
        }}
      />
      <Stack.Screen
        name="notifications"
        options={{
          ...lightHeader,
          headerShown: false,
          animation: 'slide_from_right',
        }}
      />
      <Stack.Screen
        name="challenges"
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
      <ExpoPushTokenSync />
      <WidgetSync />
      <ActivityNotificationsSync />
      <SeasonNotificationsSync />
      <LeaderboardNotificationsSync />
      <NotificationBadgeSync />
      <NotificationNavigationSync />
      <InviteJoinAlertModal />
      <FriendsGateGuard>
        <AppStackScreens />
      </FriendsGateGuard>
    </>
  );
}
