import Ionicons from '@expo/vector-icons/Ionicons';
import { useMemo, useState } from 'react';
import { ActivityIndicator, Image, Modal, Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useUserDeedPostsQuery } from '@/features/deed-feed/hooks/useDeedPostsQueries';
import { formatDeedPostDate, formatDeedPostTime } from '@/features/deed-feed/utils/deedPostDisplay';
import { AppText } from '@/shared/components/ui';
import { useActAppearance } from '@/shared/providers/ActAppearanceProvider';
import type { DeedPost } from '@/shared/types/deedPost';

type ProfileMemoriesSectionProps = {
  authorUid: string;
  /** Whether the viewer is allowed to see these memories (privacy gate decided by caller). */
  canView: boolean;
  /** When the viewer can't see memories, optionally explain why (e.g. add as a friend). */
  lockedHint?: string;
  /** Heading shown above the grid. */
  title?: string;
  /**
   * Outer chrome: `'divider'` (default) adds a top divider + spacing for use as a
   * standalone profile section; `'embedded'` removes it so it can sit inside a card.
   */
  container?: 'divider' | 'embedded';
};

function MemoryTile({ post, onPress }: { post: DeedPost; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel="Open deed"
      style={{ width: '33.3333%', aspectRatio: 1, padding: 1.5 }}
      className="active:opacity-80">
      <Image
        source={{ uri: post.photoUrl }}
        className="h-full w-full rounded-md bg-acts-canvas"
        resizeMode="cover"
      />
    </Pressable>
  );
}

export function ProfileMemoriesSection({
  authorUid,
  canView,
  lockedHint,
  title = 'Deeds',
  container = 'divider',
}: ProfileMemoriesSectionProps) {
  const act = useActAppearance();
  const insets = useSafeAreaInsets();
  const { data, isPending } = useUserDeedPostsQuery(authorUid, canView);
  const [activeId, setActiveId] = useState<string | null>(null);

  const posts = useMemo(() => data ?? [], [data]);
  const activePost = useMemo(() => posts.find((p) => p.id === activeId) ?? null, [posts, activeId]);
  const wrapperClass = container === 'embedded' ? '' : 'mt-8 border-t border-acts-border/60 pt-6';

  if (!canView) {
    if (!lockedHint) {
      return null;
    }
    return (
      <View className={wrapperClass}>
        <View className="flex-row items-center gap-2">
          <Ionicons name="lock-closed-outline" size={18} color={act.palette.muted} />
          <AppText variant="subtitle" className="text-acts-ink">
            {title}
          </AppText>
        </View>
        <AppText variant="caption" className="mt-2 leading-5 text-acts-muted">
          {lockedHint}
        </AppText>
      </View>
    );
  }

  return (
    <View className={wrapperClass}>
      <View className="mb-3 flex-row items-center gap-2">
        <Ionicons name="images-outline" size={18} color={act.palette.green} />
        <AppText variant="subtitle" className="text-acts-ink">
          {title}
        </AppText>
        {posts.length > 0 ? (
          <AppText variant="caption" className="text-acts-muted">
            {posts.length}
          </AppText>
        ) : null}
      </View>

      {isPending ? (
        <View className="items-center py-6">
          <ActivityIndicator size="small" color={act.palette.green} />
        </View>
      ) : posts.length === 0 ? (
        <AppText variant="caption" className="leading-5 text-acts-muted">
          No shared deeds yet.
        </AppText>
      ) : (
        <View className="-mx-0.5 flex-row flex-wrap">
          {posts.map((post) => (
            <MemoryTile key={post.id} post={post} onPress={() => setActiveId(post.id)} />
          ))}
        </View>
      )}

      <Modal
        visible={activePost != null}
        transparent
        statusBarTranslucent
        animationType="fade"
        onRequestClose={() => setActiveId(null)}>
        <View className="flex-1 bg-black/95">
          {/* Tap anywhere outside the photo to dismiss. */}
          <Pressable
            className="absolute inset-0"
            accessibilityRole="button"
            accessibilityLabel="Close deed"
            onPress={() => setActiveId(null)}
          />
          <View
            pointerEvents="box-none"
            style={{ flex: 1, paddingTop: insets.top + 8, paddingBottom: insets.bottom + 8 }}>
            <View className="flex-row justify-end px-4" pointerEvents="box-none">
              <Pressable
                onPress={() => setActiveId(null)}
                accessibilityRole="button"
                accessibilityLabel="Close deed"
                hitSlop={16}
                className="rounded-full bg-white/15 p-2 active:opacity-80">
                <Ionicons name="close" size={26} color="#FFFFFF" />
              </Pressable>
            </View>
            <ScrollView
              contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', paddingHorizontal: 16 }}
              showsVerticalScrollIndicator={false}>
              {activePost ? (
                <View>
                  <Image
                    source={{ uri: activePost.photoUrl }}
                    className="w-full rounded-2xl bg-black"
                    style={{ aspectRatio: 1 }}
                    resizeMode="contain"
                  />
                  {activePost.caption.trim().length > 0 ? (
                    <AppText variant="body" className="mt-4 text-center text-white">
                      {activePost.caption}
                    </AppText>
                  ) : null}
                  <AppText variant="caption" className="mt-2 text-center text-white/70">
                    {[formatDeedPostDate(activePost.createdAt), formatDeedPostTime(activePost.createdAt)]
                      .filter(Boolean)
                      .join(' · ')}
                  </AppText>
                </View>
              ) : null}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}
