import Ionicons from '@expo/vector-icons/Ionicons';
import { Stack, router } from 'expo-router';
import { useEffect, useRef } from 'react';
import { ActivityIndicator, FlatList, Image, Pressable, RefreshControl, View } from 'react-native';

import { HeaderBackLabel } from '@/shared/components/HeaderBackLabel';
import { stackHeaderChrome } from '@/shared/navigation/stackHeaderChrome';
import { useActAppearance } from '@/shared/providers/ActAppearanceProvider';
import { useAuthStore } from '@/shared/stores/authStore';
import { useDerivedNotifications } from '@/features/notifications/hooks/useDerivedNotifications';
import { hrefForDerivedNotification } from '@/features/notifications/notificationNavigation';
import type {
  DerivedNotification,
  DerivedNotificationType,
} from '@/features/notifications/derivedNotifications';
import { AppButton, AppText, Screen } from '@/shared/components/ui';

type IonName = keyof typeof Ionicons.glyphMap;

function iconForType(type: DerivedNotificationType): { icon: IonName; color: string } {
  switch (type) {
    case 'friend_request':
      return { icon: 'person-add', color: '#6366F1' };
    case 'deed_reaction':
      return { icon: 'heart', color: '#E11D74' };
    case 'deed_comment':
      return { icon: 'chatbubble-ellipses', color: '#0EA5E9' };
    case 'friend_post':
      return { icon: 'images', color: '#10B981' };
    case 'new_tasks':
      return { icon: 'sparkles', color: '#F59E0B' };
    default:
      return { icon: 'notifications', color: '#6B7280' };
  }
}

function relativeTime(ms: number): string {
  if (!ms) {
    return '';
  }
  const seconds = Math.floor((Date.now() - ms) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(ms).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function NotificationRow({
  item,
  unread,
  onPress,
}: {
  item: DerivedNotification;
  unread: boolean;
  onPress: () => void;
}) {
  const { icon, color } = iconForType(item.type);
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${item.title}. ${item.message}`}
      className={`flex-row items-center gap-3 px-5 py-3 active:opacity-80 ${unread ? 'bg-acts-green-soft/30' : ''}`}>
      <View
        className="h-11 w-11 items-center justify-center overflow-hidden rounded-full"
        style={{ backgroundColor: `${color}1F` }}>
        {item.actorPicUrl ? (
          <Image source={{ uri: item.actorPicUrl }} className="h-full w-full" resizeMode="cover" />
        ) : (
          <Ionicons name={icon} size={20} color={color} />
        )}
      </View>
      <View className="min-w-0 flex-1">
        <AppText variant="subtitle" className="text-acts-ink" numberOfLines={1}>
          {item.title}
        </AppText>
        <AppText variant="caption" className="mt-0.5 text-acts-muted" numberOfLines={2}>
          {item.message}
        </AppText>
        <AppText variant="caption" className="mt-0.5 text-acts-muted">
          {relativeTime(item.timestampMs)}
        </AppText>
      </View>
      {unread ? <View className="h-2.5 w-2.5 rounded-full bg-acts-green" /> : null}
    </Pressable>
  );
}

export default function NotificationsScreen() {
  const act = useActAppearance();
  const uid = useAuthStore((s) => s.user?.uid);
  const { items, isLoading, isError, refetch, isRefetching, lastSeenAt, unreadCount, markAllSeen } =
    useDerivedNotifications(uid);

  // Capture the unread baseline once, then clear the badge by marking everything seen.
  const baselineRef = useRef<number | null>(null);
  useEffect(() => {
    if (!isLoading && baselineRef.current === null) {
      baselineRef.current = lastSeenAt;
      void markAllSeen();
    }
  }, [isLoading, lastSeenAt, markAllSeen]);
  const baseline = baselineRef.current ?? lastSeenAt;

  const headerOptions = {
    ...stackHeaderChrome(act),
    headerShown: true as const,
    title: 'Activity',
    headerLeft: () => <HeaderBackLabel />,
  };

  if (isLoading) {
    return (
      <>
        <Stack.Screen options={headerOptions} />
        <Screen>
          <View className="flex-1 items-center justify-center py-24">
            <ActivityIndicator size="large" color={act.palette.green} />
          </View>
        </Screen>
      </>
    );
  }

  if (isError) {
    return (
      <>
        <Stack.Screen options={headerOptions} />
        <Screen>
          <View className="flex-1 items-center justify-center gap-4 px-6 py-24">
            <AppText variant="body" className="text-center text-acts-muted">
              Couldn't load your activity. Pull to try again.
            </AppText>
            <AppButton title="Try again" variant="secondary" onPress={() => void refetch()} />
          </View>
        </Screen>
      </>
    );
  }

  if (items.length === 0) {
    return (
      <>
        <Stack.Screen options={headerOptions} />
        <Screen>
          <View className="flex-1 items-center justify-center gap-3 px-8 py-24">
            <View
              className="mb-1 h-16 w-16 items-center justify-center rounded-full"
              style={{ backgroundColor: act.palette.greenSoft }}>
              <Ionicons name="notifications-outline" size={32} color={act.palette.green} />
            </View>
            <AppText variant="title" className="text-center text-acts-ink">
              No activity yet
            </AppText>
            <AppText variant="caption" className="text-center leading-5 text-acts-muted">
              Reactions and comments on your deeds, friend requests, friends' new deeds, and new acts on your
              list will show up here.
            </AppText>
          </View>
        </Screen>
      </>
    );
  }

  return (
    <>
      <Stack.Screen options={headerOptions} />
      <View className="flex-1 bg-acts-canvas">
        {unreadCount > 0 ? (
          <View className="flex-row items-center justify-between px-5 pb-1 pt-2">
            <AppText variant="caption" className="font-semibold text-acts-green">
              {unreadCount} new
            </AppText>
          </View>
        ) : null}
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <NotificationRow
              item={item}
              unread={item.timestampMs > baseline}
              onPress={() => {
                void markAllSeen();
                router.push(hrefForDerivedNotification(item));
              }}
            />
          )}
          ItemSeparatorComponent={() => <View className="ml-[72px] h-px bg-acts-border/50" />}
          contentContainerStyle={{ paddingBottom: 32 }}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={() => void refetch()} tintColor={act.palette.green} />
          }
          showsVerticalScrollIndicator={false}
        />
      </View>
    </>
  );
}
