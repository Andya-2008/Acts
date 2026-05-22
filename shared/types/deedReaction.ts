import type { Timestamp } from 'firebase/firestore';

/**
 * Allowed reaction kinds on deed feed posts (`deedPosts/{postId}/reactions/{reactorUid}`).
 * First five are free for everyone; extras unlock via shop (`SHOP_ITEM_ID_TO_REACTION_KINDS`).
 */
export type DeedReactionKind =
  | 'heart'
  | 'clap'
  | 'sparkle'
  | 'hug'
  | 'star'
  | 'rocket'
  | 'pray'
  | 'flame'
  | 'rainbow'
  | 'party'
  | 'hundred';

/** One viewer's reaction doc. */
export type DeedReactionDoc = {
  reactorUid: string;
  kind: DeedReactionKind;
  createdAt: Timestamp | null;
};

/** Aggregated reactions for a single post (for UI). */
export type DeedReactionSummary = {
  counts: Record<DeedReactionKind, number>;
  /** Current user's reaction, if any. */
  mine: DeedReactionKind | null;
};
