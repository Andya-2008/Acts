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
};

export function DeedPostHeader({ displayName, createdAt, avatarUri, authorUid }: DeedPostHeaderProps) {
  const dateStr = formatDeedPostDate(createdAt);
  const timeStr = formatDeedPostTime(createdAt);
  const uid = authorUid?.trim() || '';
  const openProfile = uid.length > 0 ? () => router.push(`/(app)/profile/${uid}` as Href) : undefined;

  return (
    <Pressable
      onPress={openProfile}
      disabled={!openProfile}
      className="flex-row gap-3 border-b border-acts-border/40 bg-transparent px-4 py-3"
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
  );
}
