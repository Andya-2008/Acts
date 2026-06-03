import { router, type Href } from 'expo-router';
import { View } from 'react-native';

import { HeaderIconButton } from '@/shared/components/HeaderIconButton';
import { ScreenTopSafeArea } from '@/shared/components/ScreenTopSafeArea';
import { useNotificationsUnreadCount } from '@/features/notifications/hooks/useDerivedNotifications';
import { AppText } from '@/shared/components/ui';
import { useAuthStore } from '@/shared/stores/authStore';

/** Bell with an unread-count badge that opens the activity inbox. */
function NotificationBell() {
  const uid = useAuthStore((s) => s.user?.uid);
  const unread = useNotificationsUnreadCount(uid);
  return (
    <View className="relative">
      <HeaderIconButton
        name="notifications-outline"
        accessibilityLabel={unread > 0 ? `Activity, ${unread} new` : 'Activity'}
        onPress={() => router.push('/(app)/notifications' as Href)}
      />
      {unread > 0 ? (
        <View
          pointerEvents="none"
          className="absolute -right-0.5 -top-0.5 h-5 min-w-[20px] items-center justify-center rounded-full border-2 border-acts-canvas bg-acts-green px-1">
          <AppText variant="caption" className="text-[10px] font-bold leading-none text-white">
            {unread > 9 ? '9+' : unread}
          </AppText>
        </View>
      ) : null}
    </View>
  );
}

/** In-screen header for Deed Feed (replaces native stack header for correct safe-area alignment). */
export function DeedFeedTopBar() {
  return (
    <ScreenTopSafeArea barClassName="border-b border-acts-border/60">
      <View className="h-12 flex-row items-center px-4">
        <AppText variant="title" className="min-w-0 flex-1 text-acts-ink" numberOfLines={1}>
          Deed Feed
        </AppText>
        <NotificationBell />
        <HeaderIconButton
          name="people-outline"
          accessibilityLabel="Friends and requests"
          onPress={() => router.push('/(app)/(tabs)/deed-feed/friends' as Href)}
        />
      </View>
    </ScreenTopSafeArea>
  );
}
