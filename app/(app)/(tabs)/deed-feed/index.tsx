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
import { getBlockedUidSet } from '@/features/safety/blockedUids';
import { useBlockUserMutation, useSubmitDeedReportMutation } from '@/features/safety/useSafetyMutations';
import { resolveDeedPostAvatar, resolveDeedPostCardBackground } from '@/features/deed-feed/utils/deedPostDisplay';
import { deedReactionKindsForViewer } from '@/features/shop/shopCatalog';
import { viewerMayPostDeedComments } from '@/features/shop/shopEntitlements';
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
  const blockedUidSet = useMemo(() => getBlockedUidSet(viewerUserInfo), [viewerUserInfo]);
  const friendUidsQuery = useFriendUidsQuery(uid);
  const friendUids = friendUidsQuery.data ?? [];
  const friendsListReady = friendUidsQuery.isFetched;
  /** Friend uids used for deed queries — excludes blocked users so their posts are not read from Firestore. */
  const friendUidsForFeed = useMemo(
    () => friendUids.filter((id) => !blockedUidSet.has(id)),
    [friendUids, blockedUidSet],
  );

  const {
    data: friendPosts,
    isPending: friendFeedPending,
    isError: friendFeedError,
    error: friendFeedErr,
    refetch: refetchFriendFeed,
    isRefetching: refetchingFriends,
  } = useFriendsDeedPostsQuery(uid, friendUidsForFeed, friendsListReady);
  const {
    data: myPosts,
    isPending: myPostsPending,
    refetch: refetchMine,
    isRefetching: refetchingMine,
  } = useMyDeedPostsQuery(uid);
  const visibleFriendPosts = useMemo(
    () => (friendPosts ?? []).filter((p) => !blockedUidSet.has(p.authorUid)),
    [friendPosts, blockedUidSet],
  );
  const deleteMutation = useDeleteDeedPostMutation();
  const authorSettingsMutation = useUpdateDeedPostAuthorSettingsMutation();
  const blockMutation = useBlockUserMutation(uid);
  const reportMutation = useSubmitDeedReportMutation();
  const [settingsPostId, setSettingsPostId] = useState<string | null>(null);

  const settingsPost = useMemo(() => {
    if (!settingsPostId) {
      return null;
    }
    return [...(visibleFriendPosts ?? []), ...(myPosts ?? [])].find((p) => p.id === settingsPostId) ?? null;
  }, [settingsPostId, visibleFriendPosts, myPosts]);

  const viewerMayComment = useMemo(
    () => viewerMayPostDeedComments(viewerUserInfo?.ShopPurchasedIds),
    [viewerUserInfo?.ShopPurchasedIds],
  );

  const viewerActs = useMemo(() => mergeActsDefaults(viewerUserInfo?.ActsSettings), [viewerUserInfo]);
  const viewerReactionsAllowed = viewerActs.reactionsEnabled !== false;
  const viewerReactionKinds = useMemo(
    () => deedReactionKindsForViewer(viewerUserInfo?.ShopPurchasedIds),
    [viewerUserInfo?.ShopPurchasedIds],
  );
  const viewerReactionKindSet = useMemo(() => new Set(viewerReactionKinds), [viewerReactionKinds]);

  const reactionPostIds = useMemo(() => {
    const out: string[] = [];
    for (const p of visibleFriendPosts ?? []) {
      if (p.feedReactionsEnabled !== false) {
        out.push(p.id);
      }
    }
    for (const p of myPosts ?? []) {
      if (p.feedReactionsEnabled !== false) {
        out.push(p.id);
      }
    }
    return [...new Set(out)];
  }, [visibleFriendPosts, myPosts]);

  const commentPostIds = useMemo(() => {
    const out: string[] = [];
    for (const p of visibleFriendPosts ?? []) {
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
  }, [visibleFriendPosts, myPosts]);

  const { data: reactionByPostId, refetch: refetchReactions } = useDeedPostReactionsQuery(uid, reactionPostIds);
  const { data: commentsByPostId, refetch: refetchComments, isRefetching: refetchingComments } =
    useDeedPostCommentsQuery(uid, commentPostIds);
  const setReactionMutation = useSetDeedReactionMutation(uid);
  const addCommentMutation = useAddDeedCommentMutation(uid);
  const deleteCommentMutation = useDeleteDeedCommentMutation(uid);

  const authorUidsForAvatars = useMemo(() => {
    const s = new Set<string>();
    for (const p of visibleFriendPosts ?? []) {
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
  }, [visibleFriendPosts, myPosts, uid]);
  const { data: authorPicByUid, refetch: refetchAuthorPics, isRefetching: refetchingAuthorPics } =
    useDeedFeedAuthorAvatarsQuery(authorUidsForAvatars);
  const viewerFallbackAvatar =
    (viewerUserInfo?.profilePicUrl && viewerUserInfo.profilePicUrl.trim()) || user?.photoURL || null;

  const onToggleReaction = useCallback(
    (postId: string, kind: DeedReactionKind) => {
      if (!viewerReactionsAllowed) {
        Alert.alert('Reactions off', mapAuthError(new Error('FEED_REACTIONS_VIEWER_OFF')));
        return;
      }
      const cur = reactionByPostId?.[postId]?.mine ?? null;
      const next = cur === kind ? null : kind;
      if (next != null && !viewerReactionKindSet.has(next)) {
        Alert.alert('Reaction locked', 'Unlock more reactions in the Kindness Arcade shop.');
        return;
      }
      setReactionMutation.mutate(
        { postId, kind: next },
        {
          onError: (e) => Alert.alert('Could not react', mapAuthError(e)),
        },
      );
    },
    [reactionByPostId, setReactionMutation, viewerReactionKindSet, viewerReactionsAllowed],
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

  const submitReportForPost = useCallback(
    (post: DeedPost, reason: string) => {
      if (!uid) {
        return;
      }
      reportMutation.mutate(
        { reporterUid: uid, postId: post.id, authorUid: post.authorUid, reason },
        {
          onSuccess: () => Alert.alert('Thanks', 'We received your report.'),
          onError: (e) => Alert.alert('Could not submit', mapAuthError(e)),
        },
      );
    },
    [uid, reportMutation],
  );

  const promptReportReason = useCallback(
    (post: DeedPost) => {
      Alert.alert('Report post', 'What best describes the issue?', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Spam', onPress: () => submitReportForPost(post, 'Spam') },
        { text: 'Harassment', onPress: () => submitReportForPost(post, 'Harassment') },
        { text: 'Inappropriate photo', onPress: () => submitReportForPost(post, 'Inappropriate photo') },
        { text: 'Other', onPress: () => submitReportForPost(post, 'Other') },
      ]);
    },
    [submitReportForPost],
  );

  const confirmBlockAuthor = useCallback(
    (authorUid: string) => {
      Alert.alert(
        'Block this person?',
        'You will not see their deed posts, and any friendship or pending friend request between you will be removed. You can unblock them anytime in Settings → Privacy.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Block',
            style: 'destructive',
            onPress: () =>
              blockMutation.mutate(authorUid, {
                onSuccess: () =>
                  Alert.alert('Blocked', 'Their posts are hidden and they are no longer on your friend list.'),
                onError: (e) => Alert.alert('Could not block', mapAuthError(e)),
              }),
          },
        ],
      );
    },
    [blockMutation],
  );

  const openFriendPostMenu = useCallback(
    (post: DeedPost) => {
      if (!uid || post.authorUid === uid) {
        return;
      }
      Alert.alert('Post options', undefined, [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Report…', onPress: () => promptReportReason(post) },
        { text: 'Block user', style: 'destructive', onPress: () => confirmBlockAuthor(post.authorUid) },
      ]);
    },
    [uid, promptReportReason, confirmBlockAuthor],
  );

  const renderFriendItem: ListRenderItem<DeedPost> = useCallback(
    ({ item }) => {
      const reactionBusy =
        setReactionMutation.isPending && setReactionMutation.variables?.postId === item.id;
      const avatarUri = resolveDeedPostAvatar(item, authorPicByUid, uid, viewerFallbackAvatar);
      const showReactionSection = Boolean(uid);
      const postReactionsEnabled = item.feedReactionsEnabled !== false;
      const canReactOnPost = postReactionsEnabled && viewerReactionsAllowed;
      const reactionBlockedReason = !postReactionsEnabled ? ('post' as const) : !viewerReactionsAllowed ? ('viewer' as const) : undefined;
      const showComments = Boolean(uid && item.feedCommentsEnabled !== false);
      return (
        <AppCard className="mb-4 overflow-hidden p-0" cardBackgroundColor={resolveDeedPostCardBackground(item)}>
          <DeedPostHeader
            displayName={item.authorDisplayName}
            createdAt={item.createdAt}
            avatarUri={avatarUri}
            authorUid={item.authorUid}
            onOpenMenu={
              uid && item.authorUid && item.authorUid !== uid ? () => openFriendPostMenu(item) : undefined
            }
          />
          <Image source={{ uri: item.photoUrl }} className="aspect-[4/3] w-full bg-acts-canvas" resizeMode="cover" />
          <View className="p-4">
            {item.caption.trim().length > 0 ? (
              <AppText variant="body" className="mb-1 text-acts-ink">
                {item.caption}
              </AppText>
            ) : null}
            {showReactionSection ? (
              <DeedPostReactionRow
                postId={item.id}
                kinds={viewerReactionKinds}
                summary={reactionByPostId?.[item.id]}
                busy={reactionBusy}
                canReact={canReactOnPost}
                blockedReason={reactionBlockedReason}
                onToggle={onToggleReaction}
              />
            ) : null}
            {showComments && uid ? (
              <DeedPostCommentsSection
                postId={item.id}
                postAuthorUid={item.authorUid}
                viewerUid={uid}
                viewerCanPostComments={viewerMayComment}
                comments={(commentsByPostId?.[item.id] ?? []).filter((c) => !blockedUidSet.has(c.authorUid))}
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
      viewerReactionKinds,
      viewerReactionsAllowed,
      viewerMayComment,
      setReactionMutation.isPending,
      setReactionMutation.variables,
      addCommentMutation,
      deleteCommentMutation,
      openFriendPostMenu,
      blockedUidSet,
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
          const showReactionSection = Boolean(uid);
          const postReactionsEnabled = post.feedReactionsEnabled !== false;
          const canReactOnPost = postReactionsEnabled && viewerReactionsAllowed;
          const reactionBlockedReason = !postReactionsEnabled
            ? ('post' as const)
            : !viewerReactionsAllowed
              ? ('viewer' as const)
              : undefined;
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
                {showReactionSection ? (
                  <DeedPostReactionRow
                    postId={post.id}
                    kinds={viewerReactionKinds}
                    summary={reactionByPostId?.[post.id]}
                    busy={reactionBusy}
                    canReact={canReactOnPost}
                    blockedReason={reactionBlockedReason}
                    onToggle={onToggleReaction}
                  />
                ) : null}
                {showComments ? (
                  <DeedPostCommentsSection
                    postId={post.id}
                    postAuthorUid={post.authorUid}
                    viewerUid={uid}
                    viewerCanPostComments={viewerMayComment}
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
                    className="min-w-[120px] shrink-0"
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
                    className="min-w-[120px] shrink-0"
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
          <AppCard className="border-acts-border/70 bg-acts-surface p-4">
            <AppText variant="subtitle" className="mb-2 text-acts-ink">
              Share a deed
            </AppText>
            <AppText variant="caption" className="mb-4 leading-5 text-acts-muted">
              When you finish an act with a photo on Tasks, you can post it here so friends can celebrate with you.
            </AppText>
            <AppButton
              title="Go to Tasks"
              variant="secondary"
              className="self-start"
              onPress={() => router.push('/(app)/(tabs)/tasks' as Href)}
            />
          </AppCard>
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
    viewerReactionKinds,
    viewerReactionsAllowed,
    viewerMayComment,
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
    friendsListReady && !friendFeedPending && (visibleFriendPosts ?? []).length === 0 ? (
      friendUids.length === 0 ? (
        <View className="px-1 py-6">
          <AppCard className="mb-4 border-acts-border/80 bg-acts-surface p-4">
            <AppText variant="subtitle" className="mb-2 text-acts-ink">
              Your feed starts with friends
            </AppText>
            <AppText variant="caption" className="mb-4 leading-5 text-acts-muted">
              {`Add people on Acts to see their shared deeds here. You can search by username, match people from your contacts, or send an invite.`}
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
          </AppCard>
        </View>
      ) : (
        <View className="px-1 py-6">
          <AppCard className="mb-4 border-acts-border/80 bg-acts-surface p-4">
            <AppText variant="subtitle" className="mb-2 text-acts-ink">
              No friend deeds yet
            </AppText>
            <AppText variant="caption" className="mb-4 leading-5 text-acts-muted">
              {`None of your friends have shared a deed photo recently. When they complete an act and share it to the feed, it will show up here.`}
            </AppText>
            <AppButton
              title="Invite or nudge friends"
              variant="secondary"
              className="mb-3 w-full"
              onPress={() => router.push('/(app)/(tabs)/deed-feed/friends' as Href)}
            />
            <AppButton
              title="Share your own deed"
              className="w-full"
              onPress={() => router.push('/(app)/(tabs)/tasks' as Href)}
            />
          </AppCard>
        </View>
      )
    ) : null;

  const feedListHeader = useMemo(() => {
    if (!friendsListReady || (friendFeedPending && (visibleFriendPosts ?? []).length === 0)) {
      return (
        <View className="mb-2">
          <View className="items-center py-8">
            <ActivityIndicator size="large" color="#E11D74" />
            <AppText variant="caption" className="mt-3 text-center text-acts-muted">
              Loading friend deeds…
            </AppText>
          </View>
        </View>
      );
    }
    return (
      <View className="mb-3 px-1">
        <AppCard className="mb-2 border-acts-green/30 bg-acts-green-soft/50 p-3">
          <AppText variant="subtitle" className="mb-1 text-acts-ink">
            Friend posts
          </AppText>
          <AppText variant="caption" className="mb-3 leading-5 text-acts-muted">
            {`This list is only people you are friends with on Acts. Use the header button or below to add friends and manage requests.`}
          </AppText>
          <AppButton
            title="Friends & requests"
            variant="secondary"
            className="self-start"
            onPress={() => router.push('/(app)/(tabs)/deed-feed/friends' as Href)}
          />
        </AppCard>
      </View>
    );
  }, [friendsListReady, friendFeedPending, visibleFriendPosts]);

  return (
    <Screen scroll={false}>
      <Fragment>
        <FlatList
          className="flex-1"
          data={visibleFriendPosts ?? []}
          keyExtractor={(item) => item.id}
          renderItem={renderFriendItem}
          ListHeaderComponent={feedListHeader}
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
