import { useCallback } from 'react';
import { ActivityIndicator, Pressable, View } from 'react-native';

import { AppText } from '@/shared/components/ui';
import {
  DEED_REACTION_EMOJI,
  deedReactionAccessibilityLabel,
  emptyDeedReactionSummary,
  totalDeedReactionCount,
} from '@/shared/constants/deedReactions';
import type { DeedReactionKind, DeedReactionSummary } from '@/shared/types/deedReaction';

export type DeedReactionBlockedReason = 'post' | 'viewer';

type DeedPostReactionRowProps = {
  postId: string;
  /** Reaction buttons this viewer may use (free + shop unlocks). */
  kinds: readonly DeedReactionKind[];
  summary: DeedReactionSummary | undefined;
  busy?: boolean;
  /** When false, emoji buttons are hidden; a short explanation is shown instead. */
  canReact?: boolean;
  /** Why this viewer cannot react - shown when canReact is false. */
  blockedReason?: DeedReactionBlockedReason;
  onToggle: (postId: string, kind: DeedReactionKind) => void;
};

function blockedMessage(reason: DeedReactionBlockedReason | undefined): string {
  if (reason === 'post') {
    return 'Reactions are off for this deed. The author can turn them on from the post menu (⋯).';
  }
  if (reason === 'viewer') {
    return 'Reactions are off in your privacy settings. Turn them on under Settings → Privacy.';
  }
  return 'Reactions are not available on this deed right now.';
}

export function DeedPostReactionRow({
  postId,
  kinds,
  summary,
  busy,
  canReact = true,
  blockedReason,
  onToggle,
}: DeedPostReactionRowProps) {
  const s = summary ?? emptyDeedReactionSummary();
  const total = totalDeedReactionCount(s);

  const pick = useCallback(
    (kind: DeedReactionKind) => {
      if (busy || !canReact) {
        return;
      }
      onToggle(postId, kind);
    },
    [busy, canReact, onToggle, postId],
  );

  return (
    <View className="mt-4 border-t border-acts-border/40 pt-4">
      <View className="mb-2 flex-row flex-wrap items-center justify-between gap-2">
        <AppText variant="caption" className="font-semibold text-acts-muted">
          React
        </AppText>
        <AppText variant="caption" className="text-acts-muted">
          {total > 0
            ? `${total} ${total === 1 ? 'cheer' : 'cheers'} from everyone`
            : canReact
              ? 'Tap to cheer them on'
              : ''}
        </AppText>
      </View>
      {!canReact ? (
        <AppText variant="caption" className="leading-5 text-acts-muted">
          {blockedMessage(blockedReason)}
        </AppText>
      ) : (
        <View className="flex-row flex-wrap gap-2">
          {kinds.length === 0 ? (
            <AppText variant="caption" className="text-acts-muted">
              No reactions unlocked yet - visit the Kindness Arcade to add more.
            </AppText>
          ) : null}
          {kinds.map((kind) => {
            const count = s.counts[kind] ?? 0;
            const selected = s.mine === kind;
            return (
              <Pressable
                key={kind}
                accessibilityRole="button"
                accessibilityState={{ disabled: busy, selected }}
                accessibilityLabel={deedReactionAccessibilityLabel(kind, count, {
                  selected,
                  canReact: true,
                })}
                disabled={busy}
                onPress={() => pick(kind)}
                className={`flex-row items-center gap-1 rounded-full px-2.5 py-1.5 active:opacity-80 ${
                  selected
                    ? 'border-2 border-acts-ink bg-acts-green-soft'
                    : 'border border-acts-border/70 bg-acts-canvas/80'
                } ${busy ? 'opacity-80' : ''}`}>
                <AppText variant="body">{DEED_REACTION_EMOJI[kind]}</AppText>
                {count > 0 ? (
                  <AppText variant="caption" className="font-semibold text-acts-ink">
                    {count}
                  </AppText>
                ) : null}
              </Pressable>
            );
          })}
        </View>
      )}
      {busy ? (
        <View className="mt-2 flex-row items-center gap-2">
          <ActivityIndicator size="small" color="#E11D74" />
        </View>
      ) : null}
    </View>
  );
}
