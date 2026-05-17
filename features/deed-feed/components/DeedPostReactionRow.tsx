import { useCallback } from 'react';
import { ActivityIndicator, Pressable, View } from 'react-native';

import { AppText } from '@/shared/components/ui';
import { DEED_REACTION_EMOJI, DEED_REACTION_KINDS } from '@/shared/constants/deedReactions';
import type { DeedReactionKind, DeedReactionSummary } from '@/shared/types/deedReaction';

function emptySummary(): DeedReactionSummary {
  return {
    counts: { heart: 0, clap: 0, sparkle: 0, hug: 0, star: 0 },
    mine: null,
  };
}

type DeedPostReactionRowProps = {
  postId: string;
  summary: DeedReactionSummary | undefined;
  busy?: boolean;
  onToggle: (postId: string, kind: DeedReactionKind) => void;
};

export function DeedPostReactionRow({ postId, summary, busy, onToggle }: DeedPostReactionRowProps) {
  const s = summary ?? emptySummary();

  const pick = useCallback(
    (kind: DeedReactionKind) => {
      if (busy) {
        return;
      }
      onToggle(postId, kind);
    },
    [busy, onToggle, postId],
  );

  return (
    <View className="mt-3 border-t border-acts-border/50 pt-3">
      <AppText variant="caption" className="mb-2 text-acts-muted">
        React
      </AppText>
      <View className="flex-row flex-wrap gap-2">
        {DEED_REACTION_KINDS.map((kind) => {
          const count = s.counts[kind];
          const selected = s.mine === kind;
          return (
            <Pressable
              key={kind}
              accessibilityRole="button"
              accessibilityLabel={`${kind} reaction, ${count} total`}
              disabled={busy}
              onPress={() => pick(kind)}
              className={`flex-row items-center gap-1 rounded-full border px-2.5 py-1.5 active:opacity-80 ${
                selected ? 'border-acts-green/50 bg-acts-green-soft' : 'border-acts-border/70 bg-acts-canvas/80'
              } ${busy ? 'opacity-50' : ''}`}>
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
      {busy ? (
        <View className="mt-2 flex-row items-center gap-2">
          <ActivityIndicator size="small" color="#E11D74" />
        </View>
      ) : null}
    </View>
  );
}
