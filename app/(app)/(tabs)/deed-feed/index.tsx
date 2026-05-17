import { Fragment, useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  ListRenderItem,
  RefreshControl,
  View,
} from 'react-native';
import { router, type Href } from 'expo-router';

import { DeedPostCardSettingsModal } from '@/features/deed-feed/components/DeedPostCardSettingsModal';
import { DeedPostCommentsSection } from '@/features/deed-feed/components/DeedPostCommentsSection';
import { DeedPostHeader } from '@/features/deed-feed/components/DeedPostHeader';
import { DeedPostReactionRow } from '@/features/deed-feed/components/DeedPostReactionRow';
import { useDeedFeedAuthorAvatarsQuery } from '@/features/deed-feed/hooks/useDeedFeedAuthorAvatarsQuery';
import {
  useAddDeedCommentMutation,
  useDeedPostCommentsQuery,
  useDeleteDeedCommentMutation,
} from '@/features/deed-feed/hooks/useDeedCommentQueries';
import { useDeedPostReactionsQuery, useSetDeedReactionMutation } from '@/features/deed-feed/hooks/useDeedReactionQueries';
import {
  useDeleteDeedPostMutation,
  useFriendsDeedPostsQuery,
  useMyDeedPostsQuery,
  useUpdateDeedPostAuthorSettingsMutation,
} from '@/features/deed-feed/hooks/useDeedPostsQueries';
import { resolveDeedPostAvatar, resolveDeedPostCardBackground } from '@/features/deed-feed/utils/deedPostDisplay';
import { useFriendUidsQuery } from '@/features/friends/hooks/useFriendsQueries';
import { mapAuthError } from '@/features/auth/utils/mapAuthError';
import type { DeedPostAuthorSettingsPatch } from '@/features/deed-feed/services/deedPostRepository';
import { useUserInfoQuery } from '@/features/user-profile/hooks/useUserInfoQuery';
import type { DeedCardTintId } from '@/shared/constants/deedPostCardTints';
import { AppButton, AppCard, AppText, FadeInView, Screen } from '@/shared/components/ui';
import { useAuthStore } from '@/shared/stores/authStore';
import { mergeActsDefaults } from '@/shared/types/actsSettings';
import type { DeedPost } from '@/shared/types/deedPost';
import type { DeedReactionKind } from '@/shared/types/deedReaction';

export default function DeedFeedScreen() {
  const uid = useAuthStore((s) => s.user?.uid);
  const user = useAuthStore((s) => s.user);
  const { data: viewerUserInfo } = useUserInfoQuery(uid);
  const friendUidsQuery = useFriendUidsQuery(uid);
  const friendUids = friendUidsQuery.data ?? [];
  const friendsListReady = friendUidsQuery.isFetched;

  const {
    data: friendPosts,
    isPending: friendFeedPending,
    isError: friendFeedError,
    error: friendFeedErr,
    refetch: refetchFriendFeed,
    isRefetching: refetchingFriends,
  } = useFriendsDeedPostsQuery(uid, friendUids, friendsListReady);
  const {
    data: myPosts,
    isPending: myPostsPending,
    refetch: refetchMine,
    isRefetching: refetchingMine,
  } = useMyDeedPostsQuery(uid);
  const deleteMutation = useDeleteDeedPostMutation();
  const authorSettingsMutation = useUpdateDeedPostAuthorSettingsMutation();
  const [settingsPostId, setSettingsPostId] = useState<string | null>(null);

  const settingsPost = useMemo(() => {
    if (!settingsPostId) {
      return null;
    }
    return [...(friendPosts ?? []), ...(myPosts ?? [])].find((p) => p.id === settingsPostId) ?? null;
  }, [settingsPostId, friendPosts, myPosts]);

  const reactionPostIds = useMemo(() => {
    const ids = [...(friendPosts ?? []).map((p) => p.id), ...(myPosts ?? []).map((p) => p.id)];
    return [...new Set(ids)];
  }, [friendPosts, myPosts]);

  const commentPostIds = useMemo(() => {
    const out: string[] = [];
    for (const p of friendPosts ?? []) {
      if (p.feedCommentsEnabled !== false) {
        out.push(p.id);
      }
    }
    for (const p of myPosts ?? []) {
      if (p.feedCommentsEnabled !== false) {
        out.push(p.id);
      }
    }
    return [...new Set(out)];
  }, [friendPosts, myPosts]);

  const { data: reactionByPostId, refetch: refetchReactions } = useDeedPostReactionsQuery(uid, reactionPostIds);
  const { data: commentsByPostId, refetch: refetchComments, isRefetching: refetchingComments } =
    useDeedPostCommentsQuery(uid, commentPostIds);
  const setReactionMutation = useSetDeedReactionMutation(uid);
  const addCommentMutation = useAddDeedCommentMutation(uid);
  const deleteCommentMutation = useDeleteDeedCommentMutation(uid);

  const viewerActs = useMemo(() => mergeActsDefaults(viewerUserInfo?.ActsSettings), [viewerUserInfo]);
  const viewerReactionsAllowed = viewerActs.reactionsEnabled !== false;

  const authorUidsForAvatars = useMemo(() => {
    const s = new Set<string>();
    for (const p of friendPosts ?? []) {
      if (p.authorUid) {
        s.add(p.authorUid);
      }
    }
    for (const p of myPosts ?? []) {
      if (p.authorUid) {
        s.add(p.authorUid);
      }
    }
    if (uid) {
      s.add(uid);
    }
    return [...s];
  }, [friendPosts, myPosts, uid]);
  const { data: authorPicByUid, refetch: refetchAuthorPics, isRefetching: refetchingAuthorPics } =
    useDeedFeedAuthorAvatarsQuery(authorUidsForAvatars);
  const viewerFallbackAvatar =
    (viewerUserInfo?.profilePicUrl && viewerUserInfo.profilePicUrl.trim()) || user?.photoURL || null;

  const onToggleReaction = useCallback(
    (postId: string, kind: DeedReactionKind) => {
      const cur = reactionByPostId?.[postId]?.mine ?? null;
      const next = cur === kind ? null : kind;
      setReactionMutation.mutate(
        { postId, kind: next },
        { onError: (e) => Alert.alert('Could not react', mapAuthError(e)) },
      );
    },
    [reactionByPostId, setReactionMutation],
  );

  const refetchAll = useCallback(() => {
    void refetchFriendFeed();
    void refetchMine();
    void refetchReactions();
    void refetchComments();
    void refetchAuthorPics();
  }, [refetchFriendFeed, refetchMine, refetchReactions, refetchComments, refetchAuthorPics]);

  const isRefetching = refetchingFriends || refetchingMine || refetchingAuthorPics || refetchingComments;

  const saveAuthorPatch = useCallback(
    (patch: DeedPostAuthorSettingsPatch) => {
      if (!uid || !settingsPostId) {
        return;
      }
      authorSettingsMutation.mutate(
        { uid, postId: settingsPostId, patch },
        { onError: (e) => Alert.alert('Could not save', mapAuthError(e)) },
      );
    },
    [uid, settingsPostId, authorSettingsMutation],
  );

  const handlePickCardTint = useCallback(
    (cardTintId: DeedCardTintId | null) => {
      saveAuthorPatch({ cardTintId });
    },
    [saveAuthorPatch],
  );

  const confirmDelete = useCallback(
    (post: DeedPost) => {
      if (!uid) {
        return;
      }
      Alert.alert('Remove post?', 'This removes the post from the feed.', [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () =>
            deleteMutation.mutate(
              { uid, postId: post.id },
              { onError: (e) => Alert.alert('Could not remove', mapAuthError(e)) },
            ),
        },
      ]);
    },
    [uid, deleteMutation],
  );

  const renderFriendItem: ListRenderItem<DeedPost> = useCallback(
    ({ item }) => {
      const reactionBusy =
        setReactionMutation.isPending && setReactionMutation.variables?.postId === item.id;
      const avatarUri = resolveDeedPostAvatar(item, authorPicByUid, uid, viewerFallbackAvatar);
      const showReactions = Boolean(uid && item.feedReactionsEnabled !== false && viewerReactionsAllowed);
      const showComments = Boolean(uid && item.feedCommentsEnabled !== false);
      return (
        <AppCard className="mb-4 overflow-hidden p-0" cardBackgroundColor={resolveDeedPostCardBackground(item)}>
          <DeedPostHeader
            displayName={item.authorDisplayName}
            createdAt={item.createdAt}
            avatarUri={avatarUri}
            authorUid={item.authorUid}
          />
          <Image source={{ uri: item.photoUrl }} className="aspect-[4/3] w-full bg-acts-canvas" resizeMode="cover" />
          <View className="p-4">
            {item.caption.trim().length > 0 ? (
              <AppText variant="body" className="mb-1 text-acts-ink">
                {item.caption}
              </AppText>
            ) : null}
            {showReactions ? (
              <DeedPostReactionRow
                postId={item.id}
                summary={reactionByPostId?.[item.id]}
                busy={reactionBusy}
                onToggle={onToggleReaction}
              />
            ) : null}
            {showComments && uid ? (
              <DeedPostCommentsSection
                postId={item.id}
                postAuthorUid={item.authorUid}
                viewerUid={uid}
                comments={commentsByPostId?.[item.id] ?? []}
                onSend={(text) =>
                  addCommentMutation.mutate(
                    { postId: item.id, text },
                    { onError: (e) => Alert.alert('Could not comment', mapAuthError(e)) },
                  )
                }
                onDelete={(commentId) =>
                  deleteCommentMutation.mutate(
                    { postId: item.id, commentId },
                    { onError: (e) => Alert.alert('Could not delete', mapAuthError(e)) },
                  )
                }
                sendBusy={addCommentMutation.isPending && addCommentMutation.variables?.postId === item.id}
                deleteBusy={deleteCommentMutation.isPending}
              />
            ) : null}
          </View>
        </AppCard>
      );
    },
    [
      uid,
      authorPicByUid,
      viewerFallbackAvatar,
      reactionByPostId,
      commentsByPostId,
      onToggleReaction,
      viewerReactionsAllowed,
      setReactionMutation.isPending,
      setReactionMutation.variables,
      addCommentMutation,
      deleteCommentMutation,
    ],
  );

  const myPostsSection = useMemo(() => {
    if (!uid) {
      return null;
    }
    const list = myPosts ?? [];
    const settingsBusyFor = (postId: string) =>
      authorSettingsMutation.isPending && authorSettingsMutation.variables?.postId === postId;
    return (
      <View className="mt-8 border-t border-acts-border/60 pt-6">
        <AppText variant="subtitle" className="mb-1 text-acts-ink">
          Your shared deeds
        </AppText>
        {myPostsPending && list.length === 0 ? (
          <View className="items-center py-4">
            <ActivityIndicator size="small" color="#E11D74" />
          </View>
        ) : null}
        {list.map((post) => {
          const avatarUri = resolveDeedPostAvatar(post, authorPicByUid, uid, viewerFallbackAvatar);
          const showReactions = post.feedReactionsEnabled !== false && viewerReactionsAllowed;
          const showComments = post.feedCommentsEnabled !== false;
          const reactionBusy =
            setReactionMutation.isPending && setReactionMutation.variables?.postId === post.id;
          return (
            <AppCard key={post.id} className="mb-3 overflow-hidden p-0" cardBackgroundColor={resolveDeedPostCardBackground(post)}>
              <DeedPostHeader
                displayName={post.authorDisplayName}
                createdAt={post.createdAt}
                avatarUri={avatarUri}
                authorUid={post.authorUid}
              />
              <Image
                source={{ uri: post.photoUrl }}
                className="aspect-[4/3] w-full bg-acts-canvas"
                resizeMode="cover"
              />
              <View className="p-4">
                {post.caption.trim().length > 0 ? (
                  <AppText variant="body" className="mb-3 text-acts-ink" numberOfLines={4}>
                    {post.caption}
                  </AppText>
                ) : null}
                {showReactions ? (
                  <DeedPostReactionRow
                    postId={post.id}
                    summary={reactionByPostId?.[post.id]}
                    busy={reactionBusy}
                    onToggle={onToggleReaction}
                  />
                ) : null}
                {showComments ? (
                  <DeedPostCommentsSection
                    postId={post.id}
                    postAuthorUid={post.authorUid}
                    viewerUid={uid}
                    comments={commentsByPostId?.[post.id] ?? []}
                    onSend={(text) =>
                      addCommentMutation.mutate(
                        { postId: post.id, text },
                        { onError: (e) => Alert.alert('Could not comment', mapAuthError(e)) },
                      )
                    }
                    onDelete={(commentId) =>
                      deleteCommentMutation.mutate(
                        { postId: post.id, commentId },
                        { onError: (e) => Alert.alert('Could not delete', mapAuthError(e)) },
                      )
                    }
                    sendBusy={addCommentMutation.isPending && addCommentMutation.variables?.postId === post.id}
                    deleteBusy={deleteCommentMutation.isPending}
                  />
                ) : null}
                <View className="mt-3 flex-row flex-wrap gap-2">
                  <AppButton
                    title="Card options"
                    variant="secondary"
                    className="min-w-[120px]"
                    disabled={
                      deleteMutation.isPending ||
                      (authorSettingsMutation.isPending && authorSettingsMutation.variables?.postId === post.id)
                    }
                    loading={settingsBusyFor(post.id)}
                    onPress={() => setSettingsPostId(post.id)}
                  />
                  <AppButton
                    title="Remove from feed"
                    variant="ghost"
                    className="min-w-[120px]"
                    disabled={
                      authorSettingsMutation.isPending ||
                      (deleteMutation.isPending && deleteMutation.variables?.postId === post.id)
                    }
                    loading={deleteMutation.isPending && deleteMutation.variables?.postId === post.id}
                    onPress={() => confirmDelete(post)}
                  />
                </View>
              </View>
            </AppCard>
          );
        })}
        {!myPostsPending && list.length === 0 ? (
          <View>
            <AppText variant="body" className="mb-3 text-acts-muted">
              Nothing here yet.
            </AppText>
            <AppButton
              title="Go to Tasks"
              variant="secondary"
              className="self-start"
              onPress={() => router.push('/(app)/(tabs)/tasks' as Href)}
            />
          </View>
        ) : null}
      </View>
    );
  }, [
    uid,
    myPosts,
    myPostsPending,
    deleteMutation.isPending,
    deleteMutation.variables,
    authorSettingsMutation.isPending,
    authorSettingsMutation.variables,
    confirmDelete,
    authorPicByUid,
    viewerFallbackAvatar,
    reactionByPostId,
    commentsByPostId,
    onToggleReaction,
    viewerReactionsAllowed,
    setReactionMutation.isPending,
    setReactionMutation.variables,
    addCommentMutation,
    deleteCommentMutation,
  ]);

  if (!uid) {
    return (
      <Screen>
        <FadeInView>
          <View className="flex-1 justify-center py-12">
            <AppText variant="body" className="mb-2 text-center text-acts-ink">
              Sign in to see the deed feed.
            </AppText>
          </View>
        </FadeInView>
      </Screen>
    );
  }

  if (friendFeedError) {
    return (
      <Screen scroll>
        <FadeInView>
          <View>
            <AppText variant="title" className="mb-2">
              Deed Feed
            </AppText>
            <AppText variant="caption" className="mb-4 text-acts-danger">
              {mapAuthError(friendFeedErr)}
            </AppText>
            <AppButton title="Try again" className="w-full" onPress={() => void refetchAll()} />
          </View>
        </FadeInView>
      </Screen>
    );
  }

  const listEmpty =
    friendsListReady && !friendFeedPending && (friendPosts ?? []).length === 0 ? (
      friendUids.length === 0 ? (
        <View className="px-1 py-6">
          <AppText variant="body" className="mb-4 text-center text-acts-ink">
            Add friends to see their deeds here.
          </AppText>
          <AppButton
            title="Find friends"
            variant="secondary"
            className="mb-3 w-full"
            onPress={() => router.push('/(app)/(tabs)/deed-feed/friends' as Href)}
          />
          <AppButton
            title="Go to Tasks"
            className="w-full"
            onPress={() => router.push('/(app)/(tabs)/tasks' as Href)}
          />
        </View>
      ) : (
        <View className="px-1 py-6">
          <AppText variant="body" className="mb-4 text-center text-acts-ink">
            No friend deeds yet.
          </AppText>
          <AppButton
            title="Your acts on Tasks"
            className="w-full"
            onPress={() => router.push('/(app)/(tabs)/tasks' as Href)}
          />
        </View>
      )
    ) : null;

  return (
    <Screen scroll={false}>
      <Fragment>
        <FlatList
          className="flex-1"
          data={friendPosts ?? []}
          keyExtractor={(item) => item.id}
          renderItem={renderFriendItem}
          ListHeaderComponent={
            <View className="mb-2">
              {!friendsListReady || (friendFeedPending && (friendPosts ?? []).length === 0) ? (
                <View className="items-center py-8">
                  <ActivityIndicator size="large" color="#E11D74" />
                  <AppText variant="caption" className="mt-3 text-center text-acts-muted">
                    Loading friend deeds…
                  </AppText>
                </View>
              ) : null}
            </View>
          }
          ListEmptyComponent={listEmpty}
          ListFooterComponent={myPostsSection}
          contentContainerStyle={{ paddingBottom: 32, flexGrow: 1 }}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={() => void refetchAll()} tintColor="#E11D74" />
          }
          showsVerticalScrollIndicator={false}
        />
        <DeedPostCardSettingsModal
          visible={settingsPost != null}
          selectedTintId={settingsPost?.cardTintId ?? null}
          reactionsOn={settingsPost?.feedReactionsEnabled !== false}
          commentsOn={settingsPost?.feedCommentsEnabled !== false}
          saving={authorSettingsMutation.isPending}
          onClose={() => {
            if (!authorSettingsMutation.isPending) {
              setSettingsPostId(null);
            }
          }}
          onPickTint={handlePickCardTint}
          onChangeReactions={(on) => saveAuthorPatch({ feedReactionsEnabled: on })}
          onChangeComments={(on) => saveAuthorPatch({ feedCommentsEnabled: on })}
        />
      </Fragment>
    </Screen>
  );
}
