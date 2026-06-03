import { useCallback, useState } from 'react';
import { Image, Pressable, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';

import { formatRelativeFeedTime } from '@/features/deed-feed/utils/formatRelativeFeedTime';
import { useUserInfoQuery } from '@/features/user-profile/hooks/useUserInfoQuery';
import { ActsTextInput, AppButton, AppText } from '@/shared/components/ui';
import { getActsTextInputBoxStyle } from '@/shared/components/ui/actsTextInputMetrics';
import type { DeedComment } from '@/shared/types/deedComment';

const MAX = 500;

function formatTime(c: DeedComment): string {
  if (c.createdAt == null) {
    return '';
  }
  try {
    return formatRelativeFeedTime(c.createdAt.toDate());
  } catch {
    return '';
  }
}

function CommentRow({
  c,
  viewerUid,
  postAuthorUid,
  onDelete,
  deleteBusy,
}: {
  c: DeedComment;
  viewerUid: string;
  postAuthorUid: string;
  onDelete: (commentId: string) => void;
  deleteBusy: boolean;
}) {
  const { data } = useUserInfoQuery(c.authorUid);
  const pic = data?.profilePicUrl?.trim() || null;
  const name =
    [data?.First, data?.Last].filter(Boolean).join(' ').trim() ||
    (data?.Username ? `@${data.Username}` : c.authorUid.slice(0, 8));
  const canDelete = c.authorUid === viewerUid || postAuthorUid === viewerUid;

  return (
    <View className="mb-3 flex-row gap-2">
      <View className="h-9 w-9 shrink-0 overflow-hidden rounded-full border border-acts-border/70 bg-acts-canvas">
        {pic ? (
          <Image source={{ uri: pic }} className="h-full w-full" resizeMode="cover" accessibilityIgnoresInvertColors />
        ) : (
          <View className="h-full w-full items-center justify-center">
            <Ionicons name="person" size={16} color="#8B6F82" />
          </View>
        )}
      </View>
      <View className="min-w-0 flex-1 rounded-2xl border border-acts-border/60 bg-acts-canvas/80 px-3 py-2">
        <View className="mb-0.5 flex-row items-center justify-between gap-2">
          <AppText variant="caption" className="font-semibold text-acts-ink" numberOfLines={1}>
            {name}
          </AppText>
          {canDelete ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Delete comment"
              hitSlop={8}
              disabled={deleteBusy}
              onPress={() => onDelete(c.id)}
              className="p-1 active:opacity-60">
              <Ionicons name="trash-outline" size={16} color="#B45309" />
            </Pressable>
          ) : null}
        </View>
        <AppText variant="body" className="text-acts-ink">
          {c.text}
        </AppText>
        {formatTime(c).length > 0 ? (
          <AppText variant="caption" className="mt-1 text-acts-muted">
            {formatTime(c)}
          </AppText>
        ) : null}
      </View>
    </View>
  );
}

type DeedPostCommentsSectionProps = {
  postId: string;
  postAuthorUid: string;
  viewerUid: string;
  comments: DeedComment[];
  onSend: (text: string) => void;
  onDelete: (commentId: string) => void;
  sendBusy: boolean;
  deleteBusy: boolean;
};

export function DeedPostCommentsSection({
  postId,
  postAuthorUid,
  viewerUid,
  comments,
  onSend,
  onDelete,
  sendBusy,
  deleteBusy,
}: DeedPostCommentsSectionProps) {
  const [draft, setDraft] = useState('');

  const submit = useCallback(() => {
    const t = draft.trim();
    if (t.length === 0 || sendBusy) {
      return;
    }
    onSend(t);
    setDraft('');
  }, [draft, onSend, sendBusy]);

  return (
    <View className="mt-3 border-t border-acts-border/50 pt-3">
      <AppText variant="caption" className="mb-2 font-semibold text-acts-muted">
        Comments
      </AppText>
      {comments.length === 0 ? (
        <View className="mb-4 rounded-2xl border border-dashed border-acts-border/80 bg-acts-canvas/60 px-3 py-4">
          <View className="mb-2 flex-row items-center gap-2">
            <Ionicons name="chatbubbles-outline" size={20} color="#8B6F82" accessibilityIgnoresInvertColors />
            <AppText variant="subtitle" className="text-acts-ink">
              Start the thread
            </AppText>
          </View>
          <AppText variant="caption" className="leading-5 text-acts-muted">
            Be the first to leave a note of encouragement — short and kind works best.
          </AppText>
        </View>
      ) : (
        <View className="mb-3">
          {comments.map((c) => (
            <CommentRow
              key={`${postId}:${c.id}`}
              c={c}
              viewerUid={viewerUid}
              postAuthorUid={postAuthorUid}
              onDelete={onDelete}
              deleteBusy={deleteBusy}
            />
          ))}
        </View>
      )}
      <ActsTextInput
        value={draft}
        onChangeText={(t) => setDraft(t.slice(0, MAX))}
        placeholder="Write a comment…"
        placeholderTextColor="#9CA3AF"
        multiline
        textAlignVertical="top"
        editable={!sendBusy}
        accessibilityLabel="Comment on this deed"
        accessibilityHint={`Up to ${MAX} characters`}
        className="mb-2 min-h-[48px] rounded-2xl border border-acts-border bg-acts-surface text-acts-ink"
        style={getActsTextInputBoxStyle({ horizontalPadding: 12 })}
      />
      <View className="flex-row items-center justify-between">
        <AppText variant="caption" className="text-acts-muted">
          {draft.length}/{MAX}
        </AppText>
        <AppButton
          title="Send"
          className="min-w-[100px]"
          disabled={sendBusy || !draft.trim()}
          loading={sendBusy}
          accessibilityLabel="Send comment"
          onPress={submit}
        />
      </View>
    </View>
  );
}
