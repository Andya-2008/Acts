import { router, type Href } from 'expo-router';
import { View } from 'react-native';

import { NotificationBadge } from '@/features/notifications/components/NotificationBadge';
import { useNotificationsUnreadCount } from '@/features/notifications/hooks/useDerivedNotifications';
import { HeaderIconButton } from '@/shared/components/HeaderIconButton';
import { useAuthStore } from '@/shared/stores/authStore';

/** Bell with unread badge — opens the activity inbox. */
export function NotificationBellButton() {
  const uid = useAuthStore((s) => s.user?.uid);
  const unread = useNotificationsUnreadCount(uid);

  return (
    <View className="relative">
      <HeaderIconButton
        name="notifications-outline"
        accessibilityLabel={unread > 0 ? `Activity, ${unread} new` : 'Activity'}
        onPress={() => router.push('/(app)/notifications' as Href)}
      />
      <NotificationBadge count={unread} variant="bell" />
    </View>
  );
}
