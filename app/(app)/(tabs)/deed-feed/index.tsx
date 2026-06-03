import Ionicons from '@expo/vector-icons/Ionicons';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  ListRenderItem,
  Pressable,
  RefreshControl,
  View,
  type ViewToken,
} from 'react-native';
import { router, type Href } from 'expo-router';

import { DeedFeedTopBar } from '@/features/deed-feed/components/DeedFeedTopBar';
import { DeedPostCommentsSection } from '@/features/deed-feed/components/DeedPostCommentsSection';
import { DeedPostHeader } from '@/features/deed-feed/components/DeedPostHeader';
import { DeedPostReactionRow } from '@/features/deed-feed/components/DeedPostReactionRow';
import { useDeedFeedAuthorAvatarsQuery } from '@/features/deed-feed/hooks/useDeedFeedAuthorAvatarsQuery';
import { useDeedFeedSeen } from '@/features/deed-feed/hooks/useDeedFeedSeen';
import {
  useAddDeedCommentMutation,
  useDeedPostCommentsQuery,
  useDeleteDeedCommentMutation,
} from '@/features/deed-feed/hooks/useDeedCommentQueries';
import { useDeedPostReactionsQuery, useSetDeedReactionMutation } from '@/features/deed-feed/hooks/useDeedReactionQueries';
import { useFriendsDeedPostsQuery } from '@/features/deed-feed/hooks/useDeedPostsQueries';
import { getBlockedUidSet } from '@/features/safety/blockedUids';
import { useBlockUserMutation, useSubmitDeedReportMutation } from '@/features/safety/useSafetyMutations';
import { resolveDeedPostAvatar, resolveDeedPostCardBackground } from '@/features/deed-feed/utils/deedPostDisplay';
import { deedReactionKindsForViewer } from '@/features/shop/shopCatalog';
import { useFriendUidsQuery } from '@/features/friends/hooks/useFriendsQueries';
import { mapAuthError } from '@/features/auth/utils/mapAuthError';
import { useUserInfoQuery } from '@/features/user-profile/hooks/useUserInfoQuery';
import { AppButton, AppCard, AppText, FadeInView, Screen, TitleWithInfo } from '@/shared/components/ui';
import { useActAppearance } from '@/shared/providers/ActAppearanceProvider';
import { useAuthStore } from '@/shared/stores/authStore';
import { mergeActsDefaults } from '@/shared/types/actsSettings';
import type { DeedPost } from '@/shared/types/deedPost';
import type { DeedReactionKind } from '@/shared/types/deedReaction';

export default function DeedFeedScreen() {
  const act = useActAppearance();
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
  const visibleFriendPosts = useMemo(
    () => (friendPosts ?? []).filter((p) => !blockedUidSet.has(p.authorUid)),
    [friendPosts, blockedUidSet],
  );

  // "Already seen" feed filtering — the main feed surfaces only posts you haven't
  // viewed yet; "Show all posts" reveals the rest for the current session.
  const { seenSnapshot, ready: seenReady, markSeen } = useDeedFeedSeen(uid);
  const [showAllPosts, setShowAllPosts] = useState(false);
  const feedPosts = useMemo(() => {
    if (showAllPosts || !seenReady) {
      return visibleFriendPosts;
    }
    return visibleFriendPosts.filter((p) => !seenSnapshot.has(p.id));
  }, [visibleFriendPosts, seenSnapshot, seenReady, showAllPosts]);
  const allCaughtUp =
    friendsListReady &&
    !friendFeedPending &&
    seenReady &&
    !showAllPosts &&
    visibleFriendPosts.length > 0 &&
    feedPosts.length === 0;

  const markSeenRef = useRef(markSeen);
  useEffect(() => {
    markSeenRef.current = markSeen;
  }, [markSeen]);
  const onViewableItemsChanged = useRef(({ viewableItems }: { viewableItems: ViewToken[] }) => {
    const ids = viewableItems
      .filter((v) => v.isViewable && (v.item as DeedPost | undefined)?.id)
      .map((v) => (v.item as DeedPost).id);
    if (ids.length > 0) {
      markSeenRef.current(ids);
    }
  }).current;
  const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 55, minimumViewTime: 350 }).current;
  const blockMutation = useBlockUserMutation(uid);
  const reportMutation = useSubmitDeedReportMutation();

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
    return [...new Set(out)];
  }, [visibleFriendPosts]);

  const commentPostIds = useMemo(() => {
    const out: string[] = [];
    for (const p of visibleFriendPosts ?? []) {
      if (p.feedCommentsEnabled !== false) {
        out.push(p.id);
      }
    }
    return [...new Set(out)];
  }, [visibleFriendPosts]);

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
    if (uid) {
      s.add(uid);
    }
    return [...s];
  }, [visibleFriendPosts, uid]);
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
        Alert.alert('Reaction locked', 'Unlock more reactions in the Kindness Arcade.');
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
    void refetchReactions();
    void refetchComments();
    void refetchAuthorPics();
  }, [refetchFriendFeed, refetchReactions, refetchComments, refetchAuthorPics]);

  const isRefetching = refetchingFriends || refetchingAuthorPics || refetchingComments;

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
          <Image source={{ uri: item.photoUrl }} className="aspect-square w-full bg-acts-canvas" resizeMode="cover" />
          <View className="p-4">
            {item.caption.trim().length > 0 ? (
              <AppText variant="body" className="mb-1 text-acts-ink">
                <AppText variant="body" className="font-semibold text-acts-ink">
                  {(item.authorDisplayName.trim() || 'Friend') + '  '}
                </AppText>
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
      setReactionMutation.isPending,
      setReactionMutation.variables,
      addCommentMutation,
      deleteCommentMutation,
      openFriendPostMenu,
      blockedUidSet,
    ],
  );

  if (!uid) {
    return (
      <Screen scroll={false} safeAreaEdges={['left', 'right', 'bottom']}>
        <DeedFeedTopBar />
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
      <Screen scroll safeAreaEdges={['left', 'right', 'bottom']}>
        <DeedFeedTopBar />
        <FadeInView>
          <View className="px-4">
            <AppText variant="caption" className="mb-4 text-acts-danger">
              {mapAuthError(friendFeedErr)}
            </AppText>
            <AppButton title="Try again" className="w-full" onPress={() => void refetchAll()} />
          </View>
        </FadeInView>
      </Screen>
    );
  }

  const listEmpty = allCaughtUp ? (
    <View className="px-1 py-6">
      <AppCard className="mb-4 items-center border-acts-green/30 bg-acts-green-soft/40 p-6">
        <View className="mb-3 h-14 w-14 items-center justify-center rounded-full bg-acts-green-soft">
          <Ionicons name="checkmark-done" size={30} color={act.palette.green} />
        </View>
        <AppText variant="subtitle" className="mb-1 text-center text-acts-ink">
          You're all caught up
        </AppText>
        <AppText variant="caption" className="mb-4 text-center leading-5 text-acts-muted">
          You've seen every recent deed from your friends. Check back later, or revisit posts you've already seen.
        </AppText>
        <AppButton
          title="Show all posts"
          variant="secondary"
          className="w-full"
          accessibilityLabel="Show all friend posts again"
          onPress={() => setShowAllPosts(true)}
        />
      </AppCard>
    </View>
  ) : friendsListReady && !friendFeedPending && (visibleFriendPosts ?? []).length === 0 ? (
      friendUids.length === 0 ? (
        <View className="px-1 py-6">
          <AppCard className="mb-4 border-acts-border/80 bg-acts-surface p-4">
            <TitleWithInfo
              title="Your feed starts with friends"
              className="mb-4"
              infoText="Add people on Acts to see their shared deeds here. You can search by username, match people from your contacts, or send an invite."
            />
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
            <TitleWithInfo
              title="No friend deeds yet"
              className="mb-4"
              infoText="None of your friends have shared a deed photo recently. When they complete an act and share it to the feed, it will show up here."
            />
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
    if (!friendsListReady || !seenReady || (friendFeedPending && (visibleFriendPosts ?? []).length === 0)) {
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
        <View className="mb-3 flex-row gap-2">
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Open friends and requests"
            onPress={() => router.push('/(app)/(tabs)/deed-feed/friends' as Href)}
            className="flex-1 flex-row items-center justify-center rounded-2xl border border-acts-green/35 bg-acts-green-soft/60 px-3 py-2.5 active:opacity-85">
            <Ionicons name="people-outline" size={18} color={act.palette.green} />
            <AppText variant="subtitle" className="ml-2 font-semibold text-acts-green">
              Friends
            </AppText>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Open your shared deeds"
            onPress={() => router.push('/(app)/my-memories' as Href)}
            className="flex-1 flex-row items-center justify-center rounded-2xl border border-acts-border bg-acts-surface px-3 py-2.5 active:opacity-85">
            <Ionicons name="images-outline" size={18} color={act.palette.ink} />
            <AppText variant="subtitle" className="ml-2 font-semibold text-acts-ink">
              Your deeds
            </AppText>
          </Pressable>
        </View>
        {showAllPosts && visibleFriendPosts.length > 0 ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Show only new posts"
            onPress={() => setShowAllPosts(false)}
            className="mb-1 flex-row items-center self-start active:opacity-70">
            <Ionicons name="checkmark-circle-outline" size={16} color={act.palette.muted} />
            <AppText variant="caption" className="ml-1 text-acts-muted">
              Showing all posts · Tap to show only new
            </AppText>
          </Pressable>
        ) : null}
      </View>
    );
  }, [act.palette.green, act.palette.ink, act.palette.muted, friendsListReady, seenReady, friendFeedPending, visibleFriendPosts, showAllPosts]);

  return (
    <Screen scroll={false} safeAreaEdges={['left', 'right', 'bottom']}>
      <DeedFeedTopBar />
      <FlatList
        className="flex-1"
        data={feedPosts}
        keyExtractor={(item) => item.id}
        renderItem={renderFriendItem}
        ListHeaderComponent={feedListHeader}
        ListEmptyComponent={listEmpty}
        contentContainerStyle={{ paddingTop: 14, paddingBottom: 32, flexGrow: 1 }}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={() => void refetchAll()} tintColor="#E11D74" />
        }
        showsVerticalScrollIndicator={false}
      />
    </Screen>
  );
}
