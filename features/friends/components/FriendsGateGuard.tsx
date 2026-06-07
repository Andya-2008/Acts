import { Redirect, useSegments, type Href } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';

import { useFriendsGate } from '@/features/friends/hooks/useFriendsGate';
import { AppText, Screen } from '@/shared/components/ui';
import { useAuthStore } from '@/shared/stores/authStore';

type FriendsGateGuardProps = {
  children: React.ReactNode;
};

/** Redirects to the required friends gate when the user has not completed it yet. */
export function FriendsGateGuard({ children }: FriendsGateGuardProps) {
  const uid = useAuthStore((s) => s.user?.uid);
  const segments = useSegments();
  const segmentsArr = segments as string[];
  const onFriendsGateScreen = segmentsArr.includes('friends-get-started');
  /** Allow friend-request deep links while the post-signup gate is still open. */
  const onFriendsListScreen =
    segmentsArr.includes('deed-feed') && segmentsArr[segmentsArr.length - 1] === 'friends';
  const { ready, required } = useFriendsGate(uid);

  if (!uid) {
    return <>{children}</>;
  }

  if (!ready) {
    return (
      <Screen>
        <View className="flex-1 items-center justify-center gap-3 px-6">
          <ActivityIndicator size="large" color="#3D8B6E" />
          <AppText variant="caption" className="text-center text-acts-muted">
            Loading…
          </AppText>
        </View>
      </Screen>
    );
  }

  if (required && !onFriendsGateScreen && !onFriendsListScreen) {
    return <Redirect href={'/(app)/friends-get-started' as Href} />;
  }

  return <>{children}</>;
}
