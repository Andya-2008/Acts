import Ionicons from '@expo/vector-icons/Ionicons';
import { router, type Href } from 'expo-router';
import type { Timestamp } from 'firebase/firestore';
import { Image, Pressable, View } from 'react-native';

import { AppText } from '@/shared/components/ui';

import { formatDeedPostDate, formatDeedPostTime } from '@/features/deed-feed/utils/deedPostDisplay';

type DeedPostHeaderProps = {
  displayName: string;
  createdAt: Timestamp | null;
  avatarUri: string | null;
  /** When set, tapping the header opens that user’s public profile. */
  authorUid?: string | null;
  /** Report / block menu (e.g. friend posts on the deed feed). */
  onOpenMenu?: () => void;
};

export function DeedPostHeader({ displayName, createdAt, avatarUri, authorUid, onOpenMenu }: DeedPostHeaderProps) {
  const dateStr = formatDeedPostDate(createdAt);
  const timeStr = formatDeedPostTime(createdAt);
  const uid = authorUid?.trim() || '';
  const openProfile = uid.length > 0 ? () => router.push(`/(app)/profile/${uid}` as Href) : undefined;

  return (
    <View className="flex-row items-stretch border-b border-acts-border/40 bg-transparent">
      <Pressable
        onPress={openProfile}
        disabled={!openProfile}
        className="min-w-0 flex-1 flex-row gap-3 px-4 py-3"
        accessibilityRole={openProfile ? 'button' : undefined}
        accessibilityLabel={openProfile ? `View ${displayName.trim() || 'author'} profile` : undefined}>
        <View className="h-12 w-12 overflow-hidden rounded-full border border-acts-border/70 bg-acts-canvas">
          {avatarUri ? (
            <Image source={{ uri: avatarUri }} className="h-full w-full" resizeMode="cover" accessibilityIgnoresInvertColors />
          ) : (
            <View className="h-full w-full items-center justify-center">
              <Ionicons name="person" size={26} color="#8B6F82" accessibilityLabel="No profile photo" />
            </View>
          )}
        </View>
        <View className="min-w-0 flex-1 justify-center">
          <AppText variant="subtitle" className="text-acts-ink" numberOfLines={2}>
            {displayName.trim() || 'Friend'}
          </AppText>
          {dateStr.length > 0 ? (
            <AppText variant="caption" className="mt-0.5 text-acts-muted">
              {dateStr}
            </AppText>
          ) : null}
          {timeStr.length > 0 ? (
            <AppText variant="caption" className="text-acts-muted">
              {timeStr}
            </AppText>
          ) : null}
        </View>
      </Pressable>
      {onOpenMenu ? (
        <View className="shrink-0 justify-center">
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Post options"
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            className="justify-center px-3 py-3"
            onPress={onOpenMenu}>
            <Ionicons name="ellipsis-horizontal" size={22} color="#8B6F82" />
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}
