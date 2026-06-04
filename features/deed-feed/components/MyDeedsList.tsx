import { Fragment, useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Image, View } from 'react-native';
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
  useMyDeedPostsQuery,
  useUpdateDeedPostAuthorSettingsMutation,
} from '@/features/deed-feed/hooks/useDeedPostsQueries';
import { resolveDeedPostAvatar, resolveDeedPostCardBackground } from '@/features/deed-feed/utils/deedPostDisplay';
import type { DeedPostAuthorSettingsPatch } from '@/features/deed-feed/services/deedPostRepository';
import { deedReactionKindsForViewer } from '@/features/shop/shopCatalog';
import { mapAuthError } from '@/features/auth/utils/mapAuthError';
import { useUserInfoQuery } from '@/features/user-profile/hooks/useUserInfoQuery';
import { useAuthStore } from '@/shared/stores/authStore';
import { useActAppearance } from '@/shared/providers/ActAppearanceProvider';
import { AppButton, AppCard, AppText, TitleWithInfo } from '@/shared/components/ui';
import { mergeActsDefaults } from '@/shared/types/actsSettings';
import type { DeedCardTintId } from '@/shared/constants/deedPostCardTints';
import type { DeedPost } from '@/shared/types/deedPost';
import type { DeedReactionKind } from '@/shared/types/deedReaction';

/**
 * The current user's own deed posts with full management: edit card appearance,
 * toggle reactions/comments, and remove from the feed. Self-contained (owns its
 * queries/mutations) so it can live on its own "Your deeds" screen.
 */
export function MyDeedsList({ uid }: { uid: string }) {
  const act = useActAppearance();
  const user = useAuthStore((s) => s.user);
  const { data: viewerUserInfo } = useUserInfoQuery(uid);
  const { data: myPosts, isPending: myPostsPending } = useMyDeedPostsQuery(uid);

  const deleteMutation = useDeleteDeedPostMutation();
  const authorSettingsMutation = useUpdateDeedPostAuthorSettingsMutation();
  const setReactionMutation = useSetDeedReactionMutation(uid);
  const addCommentMutation = useAddDeedCommentMutation(uid);
  const deleteCommentMutation = useDeleteDeedCommentMutation(uid);

  const [settingsPostId, setSettingsPostId] = useState<string | null>(null);

  const posts = useMemo(() => myPosts ?? [], [myPosts]);
  const settingsPost = useMemo(
    () => (settingsPostId ? posts.find((p) => p.id === settingsPostId) ?? null : null),
    [settingsPostId, posts],
  );

  const viewerActs = useMemo(() => mergeActsDefaults(viewerUserInfo?.ActsSettings), [viewerUserInfo]);
  const viewerReactionsAllowed = viewerActs.reactionsEnabled !== false;
  const viewerReactionKinds = useMemo(
    () => deedReactionKindsForViewer(viewerUserInfo?.ShopPurchasedIds),
    [viewerUserInfo?.ShopPurchasedIds],
  );
  const viewerReactionKindSet = useMemo(() => new Set(viewerReactionKinds), [viewerReactionKinds]);

  const reactionPostIds = useMemo(
    () => posts.filter((p) => p.feedReactionsEnabled !== false).map((p) => p.id),
    [posts],
  );
  const commentPostIds = useMemo(
    () => posts.filter((p) => p.feedCommentsEnabled !== false).map((p) => p.id),
    [posts],
  );

  const { data: reactionByPostId } = useDeedPostReactionsQuery(uid, reactionPostIds);
  const { data: commentsByPostId } = useDeedPostCommentsQuery(uid, commentPostIds);
  const { data: authorPicByUid } = useDeedFeedAuthorAvatarsQuery([uid]);
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
        { onError: (e) => Alert.alert('Could not react', mapAuthError(e)) },
      );
    },
    [reactionByPostId, setReactionMutation, viewerReactionKindSet, viewerReactionsAllowed],
  );

  const saveAuthorPatch = useCallback(
    (patch: DeedPostAuthorSettingsPatch) => {
      if (!settingsPostId) {
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
    (cardTintId: DeedCardTintId | null) => saveAuthorPatch({ cardTintId }),
    [saveAuthorPatch],
  );

  const confirmDelete = useCallback(
    (post: DeedPost) => {
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

  const settingsBusyFor = (postId: string) =>
    authorSettingsMutation.isPending && authorSettingsMutation.variables?.postId === postId;

  if (myPostsPending && posts.length === 0) {
    return (
      <View className="items-center py-10">
        <ActivityIndicator size="small" color="#E11D74" />
      </View>
    );
  }

  if (posts.length === 0) {
    return (
      <AppCard className="border-acts-border/70 bg-acts-surface p-4">
        <TitleWithInfo
          title="Share a deed"
          className="mb-4"
          infoText="When you finish an act with a photo on Tasks, you can post it here so friends can celebrate with you."
        />
        <AppButton
          title="Go to Tasks"
          variant="secondary"
          className="self-start"
          onPress={() => router.push('/(app)/(tabs)/tasks' as Href)}
        />
      </AppCard>
    );
  }

  return (
    <Fragment>
      {posts.map((post) => {
        const avatarUri = resolveDeedPostAvatar(post, authorPicByUid, uid, viewerFallbackAvatar);
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
          <AppCard
            key={post.id}
            className="mb-3 overflow-hidden p-0"
            cardBackgroundColor={act.palette.isDark ? act.palette.surface : resolveDeedPostCardBackground(post)}>
            <DeedPostHeader
              displayName={post.authorDisplayName}
              createdAt={post.createdAt}
              avatarUri={avatarUri}
              authorUid={post.authorUid}
            />
            <Image
              source={{ uri: post.photoUrl }}
              className="aspect-square w-full bg-acts-canvas"
              resizeMode="cover"
            />
            <View className="p-4">
              {post.caption.trim().length > 0 ? (
                <AppText variant="body" className="mb-3 text-acts-ink" numberOfLines={4}>
                  {post.caption}
                </AppText>
              ) : null}
              <DeedPostReactionRow
                postId={post.id}
                kinds={viewerReactionKinds}
                summary={reactionByPostId?.[post.id]}
                busy={reactionBusy}
                canReact={canReactOnPost}
                blockedReason={reactionBlockedReason}
                onToggle={onToggleReaction}
              />
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
  );
}
