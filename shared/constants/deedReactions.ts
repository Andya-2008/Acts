import type { DeedReactionKind } from '@/shared/types/deedReaction';

export const DEED_REACTION_KINDS: readonly DeedReactionKind[] = [
  'heart',
  'clap',
  'sparkle',
  'hug',
  'star',
] as const;

export const DEED_REACTION_EMOJI: Record<DeedReactionKind, string> = {
  heart: '❤️',
  clap: '👏',
  sparkle: '✨',
  hug: '🤗',
  star: '⭐',
};
