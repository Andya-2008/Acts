import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  ListRenderItem,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  View,
  useWindowDimensions,
} from 'react-native';
import { router, type Href } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { useCreateDeedPostMutation } from '@/features/deed-feed/hooks/useDeedPostsQueries';
import { authorDisplayNameForDeed } from '@/features/deed-feed/utils/authorDisplayName';
import { useTasksQuery } from '@/features/tasks/hooks/useTasksQueries';
import { useUserInfoQuery } from '@/features/user-profile/hooks/useUserInfoQuery';
import { mapAuthError } from '@/features/auth/utils/mapAuthError';
import { AppButton, AppText, FadeInView, Screen } from '@/shared/components/ui';
import { useAuthStore } from '@/shared/stores/authStore';
import { useCurrencyStore } from '@/shared/stores/currencyStore';
import { HEARTS_FOR_DEED_FEED_SHARE } from '@/shared/utils/deedFeedReward';
import type { ActTask } from '@/shared/types/task';

function formatCompletedAt(task: ActTask): string {
  if (task.completedAt == null) {
    return '';
  }
  try {
    return task.completedAt.toDate().toLocaleString(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  } catch {
    return '';
  }
}

function completedTimeMs(task: ActTask): number {
  if (task.completedAt == null) {
    return 0;
  }
  try {
    return task.completedAt.toMillis();
  } catch {
    return 0;
  }
}

export default function TaskMemoriesScreen() {
  const insets = useSafeAreaInsets();
  const uid = useAuthStore((s) => s.user?.uid);
  const user = useAuthStore((s) => s.user);
  const { data: userInfo } = useUserInfoQuery(uid);
  const { data: tasks, isPending, isError, error, refetch, isRefetching } = useTasksQuery(uid);
  const { width: winW, height: winH } = useWindowDimensions();
  const [previewUri, setPreviewUri] = useState<string | null>(null);
  const [shareError, setShareError] = useState<string | null>(null);
  const createDeedPostMutation = useCreateDeedPostMutation();

  const memories = useMemo(() => {
    const list = (tasks ?? []).filter((t) => t.completedAt != null);
    list.sort((a, b) => completedTimeMs(b) - completedTimeMs(a));
    return list;
  }, [tasks]);

  const photoBlockHeight = Math.round(Math.min(winH * 0.88, winW * 1.6));

  const shareToDeedFeed = useCallback(
    (task: ActTask) => {
      if (task.deedFeedPostId) {
        return;
      }
      const url = task.photoUrl?.trim();
      if (!uid || !url) {
        return;
      }
      setShareError(null);
      const authorDisplayName = authorDisplayNameForDeed(userInfo ?? undefined, user);
      const authorProfilePicUrl = userInfo?.profilePicUrl?.trim() || user?.photoURL?.trim() || '';
      createDeedPostMutation.mutate(
        {
          uid,
          authorDisplayName,
          authorProfilePicUrl,
          caption: task.textShort.trim(),
          photoSourceUri: url,
          sourceTaskId: task.id,
        },
        { onError: (e) => setShareError(mapAuthError(e)), onSuccess: () => {
          setShareError(null);
          useCurrencyStore.getState().adjustBalance(HEARTS_FOR_DEED_FEED_SHARE);
        } },
      );
    },
    [uid, user, userInfo, createDeedPostMutation],
  );

  const renderItem: ListRenderItem<ActTask> = useCallback(
    ({ item }) => (
      <View className="mb-10">
        {item.photoUrl ? (
          <Pressable
            accessibilityRole="imagebutton"
            accessibilityLabel="View photo full screen"
            onPress={() => setPreviewUri(item.photoUrl)}>
            <Image
              source={{ uri: item.photoUrl }}
              style={{ width: winW, height: photoBlockHeight }}
              resizeMode="cover"
            />
          </Pressable>
        ) : (
          <View
            className="w-full justify-center border-b border-t border-acts-border/60 bg-acts-green-soft/40"
            style={{ height: Math.min(200, photoBlockHeight * 0.45) }}>
            <AppText variant="caption" className="px-5 text-center text-acts-muted">
              No photo for this act
            </AppText>
          </View>
        )}
        <View className="border-b border-acts-border/50 px-5 pb-4 pt-4">
          <AppText variant="subtitle" className="text-acts-ink">
            {item.textShort}
          </AppText>
          <AppText variant="caption" className="mt-1 text-acts-muted">
            {formatCompletedAt(item)}
          </AppText>
          {item.photoUrl && Platform.OS !== 'web' && !item.deedFeedPostId ? (
            <AppButton
              title="Share to deed feed"
              variant="secondary"
              className="mt-3"
              disabled={createDeedPostMutation.isPending}
              loading={
                createDeedPostMutation.isPending &&
                createDeedPostMutation.variables?.sourceTaskId === item.id
              }
              onPress={() => shareToDeedFeed(item)}
            />
          ) : null}
          {item.deedFeedPostId ? (
            <AppText variant="caption" className="mt-2 text-acts-blue">
              On deed feed
            </AppText>
          ) : null}
        </View>
      </View>
    ),
    [photoBlockHeight, winW, createDeedPostMutation.isPending, createDeedPostMutation.variables, shareToDeedFeed],
  );

  const listEmpty = useMemo(() => {
    if (isPending && !tasks) {
      return (
        <View className="items-center py-16">
          <ActivityIndicator size="large" color="#E11D74" />
          <AppText variant="caption" className="mt-3 text-center text-acts-muted">
            Loading your memories…
          </AppText>
        </View>
      );
    }
    return (
      <FadeInView>
        <View className="px-5 py-12">
          <AppText variant="body" className="mb-4 text-center text-acts-ink">
            No memories yet.
          </AppText>
          <AppButton title="Go to Tasks" onPress={() => router.push('/(app)/(tabs)/tasks' as Href)} />
        </View>
      </FadeInView>
    );
  }, [isPending, tasks]);

  if (!uid) {
    return (
      <Screen>
        <FadeInView>
          <View>
            <AppText variant="body" className="mb-2">
              Sign in to see your memories.
            </AppText>
          </View>
        </FadeInView>
      </Screen>
    );
  }

  if (isError) {
    return (
      <Screen scroll>
        <FadeInView>
          <View>
            <AppText variant="title" className="mb-2">
              Memories
            </AppText>
            <AppText variant="caption" className="mb-4 text-acts-danger">
              {mapAuthError(error)}
            </AppText>
            <AppButton title="Try again" onPress={() => void refetch()} />
          </View>
        </FadeInView>
      </Screen>
    );
  }

  return (
    <Screen scroll={false} className="bg-acts-canvas">
      {shareError ? (
        <View className="px-5 pt-2">
          <AppText variant="caption" className="text-acts-danger">
            {shareError}
          </AppText>
        </View>
      ) : null}
      <FlatList
        className="flex-1 -mx-5"
        data={memories}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        ListEmptyComponent={listEmpty}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={() => void refetch()} tintColor="#E11D74" />}
        showsVerticalScrollIndicator={false}
        removeClippedSubviews={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}
      />
      <Modal visible={previewUri != null} transparent animationType="fade" onRequestClose={() => setPreviewUri(null)}>
        <SafeAreaView className="flex-1 bg-black" edges={['top', 'bottom', 'left', 'right']}>
          <Pressable
            className="flex-1"
            onPress={() => setPreviewUri(null)}
            accessibilityLabel="Close full screen photo">
            {previewUri ? (
              <Image
                source={{ uri: previewUri }}
                style={{ width: winW, height: winH }}
                resizeMode="contain"
              />
            ) : null}
          </Pressable>
        </SafeAreaView>
      </Modal>
    </Screen>
  );
}
