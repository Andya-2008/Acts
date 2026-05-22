import { router, type Href } from 'expo-router';

import { FriendsGetStartedScreen } from '@/features/friends/components/FriendsGetStartedScreen';

export default function FriendsGetStartedRoute() {
  return (
    <FriendsGetStartedScreen
      onFinished={() => {
        router.replace('/(app)/(tabs)/tasks' as Href);
      }}
    />
  );
}
