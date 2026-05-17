import type { DeedCardTintId } from '@/shared/constants/deedPostCardTints';
import type { Timestamp } from 'firebase/firestore';

/** Firestore `deedPosts/{postId}` — community deed feed entry. */
export type DeedPost = {
  id: string;
  authorUid: string;
  authorDisplayName: string;
  /** Snapshot of profile photo URL when posted; may be empty on older docs. */
  authorProfilePicUrl: string;
  caption: string;
  photoUrl: string;
  createdAt: Timestamp | null;
  /** When posted from a task memory, links back for unlock-on-delete. */
  sourceTaskId?: string | null;
  /** Light card background chosen by the author; omitted on older posts. */
  cardTintId?: DeedCardTintId | null;
  /** When false, friends cannot add reactions (omitted = on). */
  feedReactionsEnabled?: boolean;
  /** When false, friends cannot comment (omitted = on). */
  feedCommentsEnabled?: boolean;
};
