import { router, type Href } from 'expo-router';
import { View } from 'react-native';

import { NotificationBellButton } from '@/features/notifications/components/NotificationBellButton';
import { HeaderIconButton } from '@/shared/components/HeaderIconButton';
import { ScreenTopSafeArea } from '@/shared/components/ScreenTopSafeArea';
import { AppText } from '@/shared/components/ui';

/** In-screen header for Deed Feed (replaces native stack header for correct safe-area alignment). */
export function DeedFeedTopBar() {
  return (
    <ScreenTopSafeArea barClassName="border-b border-acts-border/60">
      <View className="h-12 flex-row items-center px-4">
        <AppText variant="title" className="min-w-0 flex-1 text-acts-ink" numberOfLines={1}>
          Deed Feed
        </AppText>
        <NotificationBellButton />
        <HeaderIconButton
          name="people-outline"
          accessibilityLabel="Friends and requests"
          onPress={() => router.push('/(app)/(tabs)/deed-feed/friends' as Href)}
        />
      </View>
    </ScreenTopSafeArea>
  );
}
