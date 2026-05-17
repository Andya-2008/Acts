import type { Timestamp } from 'firebase/firestore';

/** Firestore `deedPosts/{postId}/comments/{commentId}`. */
export type DeedComment = {
  id: string;
  authorUid: string;
  text: string;
  createdAt: Timestamp | null;
};
