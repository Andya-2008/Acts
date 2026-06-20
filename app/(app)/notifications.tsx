import Ionicons from '@expo/vector-icons/Ionicons';
import { Stack, router } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  RefreshControl,
  SectionList,
  View,
} from 'react-native';

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
import { groupNotificationsByTime } from '@/features/notifications/utils/notificationInboxSections';
import { relativeNotificationTime } from '@/features/notifications/utils/relativeNotificationTime';
import { AppButton, AppText, Screen } from '@/shared/components/ui';

type IonName = keyof typeof Ionicons.glyphMap;

function iconForType(type: DerivedNotificationType): { icon: IonName; color: string } {
  switch (type) {
    case 'friend_request':
      return { icon: 'person-add', color: '#6366F1' };
    case 'friend_request_accepted':
      return { icon: 'people', color: '#6366F1' };
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
          {relativeNotificationTime(item.timestampMs)}
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

  const baselineRef = useRef<number | null>(null);
  const [newBannerCount, setNewBannerCount] = useState(0);
  const [readBaselineMs, setReadBaselineMs] = useState<number | null>(null);

  useEffect(() => {
    if (!isLoading && baselineRef.current === null) {
      baselineRef.current = lastSeenAt;
      setNewBannerCount(unreadCount);
      setReadBaselineMs(lastSeenAt);
      void markAllSeen();
    }
  }, [isLoading, lastSeenAt, markAllSeen, unreadCount]);

  const unreadBaseline = readBaselineMs ?? baselineRef.current ?? lastSeenAt;
  const showNewBanner = newBannerCount > 0;

  const sections = useMemo(() => groupNotificationsByTime(items), [items]);

  const onMarkAllRead = () => {
    const now = Date.now();
    baselineRef.current = now;
    setReadBaselineMs(now);
    setNewBannerCount(0);
    void markAllSeen();
  };

  const headerOptions = {
    ...stackHeaderChrome(act),
    headerShown: true as const,
    title: 'Activity',
    headerLeft: () => <HeaderBackLabel />,
    headerRight: () =>
      showNewBanner ? (
        <Pressable
          onPress={onMarkAllRead}
          accessibilityRole="button"
          accessibilityLabel="Mark all activity as read"
          className="px-3 py-1 active:opacity-70">
          <AppText variant="caption" className="font-semibold text-acts-green">
            Mark all read
          </AppText>
        </Pressable>
      ) : null,
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
        {showNewBanner ? (
          <View className="flex-row items-center justify-between px-5 pb-1 pt-2">
            <AppText variant="caption" className="font-semibold text-acts-green">
              {newBannerCount} new
            </AppText>
          </View>
        ) : null}
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.id}
          renderSectionHeader={({ section }) => (
            <View className="bg-acts-canvas px-5 pb-1 pt-3">
              <AppText variant="label" className="text-acts-muted">
                {section.title}
              </AppText>
            </View>
          )}
          renderItem={({ item }) => (
            <NotificationRow
              item={item}
              unread={item.timestampMs > unreadBaseline}
              onPress={() => {
                void markAllSeen();
                setReadBaselineMs(Date.now());
                router.push(hrefForDerivedNotification(item));
              }}
            />
          )}
          ItemSeparatorComponent={() => <View className="ml-[72px] h-px bg-acts-border/50" />}
          SectionSeparatorComponent={() => <View className="h-1" />}
          contentContainerStyle={{ paddingBottom: 32 }}
          stickySectionHeadersEnabled={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={() => void refetch()}
              tintColor={act.palette.green}
            />
          }
          showsVerticalScrollIndicator={false}
        />
      </View>
    </>
  );
}
