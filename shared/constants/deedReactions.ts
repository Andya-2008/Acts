import type { DeedReactionKind, DeedReactionSummary } from '@/shared/types/deedReaction';

/** Everyone can use these without a shop purchase. */
export const FREE_DEED_REACTION_KINDS: readonly DeedReactionKind[] = [
  'heart',
  'clap',
  'sparkle',
  'hug',
  'star',
] as const;

/** All kinds accepted by Firestore / aggregation (free + shop extras). */
export const ALL_DEED_REACTION_KINDS: readonly DeedReactionKind[] = [
  ...FREE_DEED_REACTION_KINDS,
  'rocket',
  'pray',
  'flame',
  'rainbow',
  'party',
  'hundred',
] as const;

/** @deprecated use ALL_DEED_REACTION_KINDS - kept for incremental refactors */
export const DEED_REACTION_KINDS = ALL_DEED_REACTION_KINDS;

/** VoiceOver-friendly names (not just internal kind ids). */
export const DEED_REACTION_A11Y_NAME: Record<DeedReactionKind, string> = {
  heart: 'Love',
  clap: 'Applause',
  sparkle: 'Sparkle',
  hug: 'Hug',
  star: 'Star',
  rocket: 'Rocket',
  pray: 'Thanks',
  flame: 'Fire',
  rainbow: 'Rainbow',
  party: 'Party',
  hundred: 'Hundred',
};

export const DEED_REACTION_EMOJI: Record<DeedReactionKind, string> = {
  heart: '❤️',
  clap: '👏',
  sparkle: '✨',
  hug: '🤗',
  star: '⭐',
  rocket: '🚀',
  pray: '🙏',
  flame: '🔥',
  rainbow: '🌈',
  party: '🎉',
  hundred: '💯',
};

export function emptyDeedReactionSummary(): DeedReactionSummary {
  const counts = {} as Record<DeedReactionKind, number>;
  for (const k of ALL_DEED_REACTION_KINDS) {
    counts[k] = 0;
  }
  return { counts, mine: null };
}

export function deedReactionAccessibilityLabel(
  kind: DeedReactionKind,
  count: number,
  options?: { selected?: boolean; canReact?: boolean },
): string {
  const name = DEED_REACTION_A11Y_NAME[kind];
  const emoji = DEED_REACTION_EMOJI[kind];
  const countPart = count === 0 ? 'no reactions yet' : `${count} ${count === 1 ? 'person' : 'people'}`;
  const selectedPart = options?.selected ? ', selected' : '';
  const actionPart =
    options?.canReact === false ? '' : options?.selected ? ', double tap to remove' : ', double tap to add';
  return `${name} ${emoji}, ${countPart}${selectedPart}${actionPart}`;
}

export function totalDeedReactionCount(summary: DeedReactionSummary | undefined): number {
  if (!summary) {
    return 0;
  }
  return ALL_DEED_REACTION_KINDS.reduce((n, k) => n + (summary.counts[k] ?? 0), 0);
}
