import {
  collection,
  deleteDoc,
  deleteField,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore';

import { clearTaskDeedFeedPostId } from '@/features/tasks/services/taskRepository';
import type { DeedCardTintId } from '@/shared/constants/deedPostCardTints';
import { DEED_CARD_TINT_IDS, parseDeedCardTintId } from '@/shared/constants/deedPostCardTints';
import { firestoreCollections } from '@/shared/config/firestore';
import { getFirebaseFirestore } from '@/shared/services/firebase/client';
import { deleteDeedFeedPhotoObject, uploadDeedFeedPhoto } from '@/shared/services/firebase/storageUploads';
import type { DeedPost } from '@/shared/types/deedPost';

const FIRESTORE_IN_LIMIT = 30;
const FRIENDS_FEED_PER_CHUNK = 48;

function parsePost(id: string, data: Record<string, unknown>): DeedPost {
  const src = data.sourceTaskId;
  return {
    id,
    authorUid: String(data.authorUid ?? ''),
    authorDisplayName: String(data.authorDisplayName ?? ''),
    authorProfilePicUrl:
      typeof data.authorProfilePicUrl === 'string' ? data.authorProfilePicUrl.trim() : '',
    caption: String(data.caption ?? ''),
    photoUrl: String(data.photoUrl ?? ''),
    createdAt: (data.createdAt as DeedPost['createdAt']) ?? null,
    sourceTaskId: typeof src === 'string' && src.trim().length > 0 ? src.trim() : null,
    cardTintId: parseDeedCardTintId(data.cardTintId),
    feedReactionsEnabled: data.feedReactionsEnabled === false ? false : true,
    feedCommentsEnabled: data.feedCommentsEnabled === false ? false : true,
  };
}

function postTimeMs(post: DeedPost): number {
  if (post.createdAt == null) {
    return 0;
  }
  try {
    return post.createdAt.toMillis();
  } catch {
    return 0;
  }
}

/** Latest deeds from given friend uids (excludes the viewer; pass only friends). */
export async function fetchFriendsDeedPosts(friendUids: string[], max = 40): Promise<DeedPost[]> {
  if (friendUids.length === 0) {
    return [];
  }
  const db = getFirebaseFirestore();
  const col = collection(db, firestoreCollections.deedPosts);
  const chunks: string[][] = [];
  for (let i = 0; i < friendUids.length; i += FIRESTORE_IN_LIMIT) {
    chunks.push(friendUids.slice(i, i + FIRESTORE_IN_LIMIT));
  }
  const seen = new Set<string>();
  const posts: DeedPost[] = [];
  await Promise.all(
    chunks.map(async (uids) => {
      const q = query(
        col,
        where('authorUid', 'in', uids),
        orderBy('createdAt', 'desc'),
        limit(FRIENDS_FEED_PER_CHUNK),
      );
      const snap = await getDocs(q);
      for (const d of snap.docs) {
        if (seen.has(d.id)) {
          continue;
        }
        seen.add(d.id);
        posts.push(parsePost(d.id, d.data()));
      }
    }),
  );
  posts.sort((a, b) => postTimeMs(b) - postTimeMs(a));
  return posts.slice(0, max);
}

export async function fetchMyDeedPosts(uid: string, max = 30): Promise<DeedPost[]> {
  const db = getFirebaseFirestore();
  const q = query(
    collection(db, firestoreCollections.deedPosts),
    where('authorUid', '==', uid),
    orderBy('createdAt', 'desc'),
    limit(max),
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => parsePost(d.id, d.data()));
}

export async function createDeedPostWithPhoto(input: {
  uid: string;
  authorDisplayName: string;
  /** Profile photo URL at post time (may be empty). */
  authorProfilePicUrl?: string | null;
  caption: string;
  /** Local `file://` image or a remote URL (e.g. task memory download URL). */
  photoSourceUri: string;
  /** When set, stored on the post and `userInfo/{uid}/tasks/{sourceTaskId}` gets `deedFeedPostId`. */
  sourceTaskId?: string;
}): Promise<string> {
  const db = getFirebaseFirestore();
  const postRef = doc(collection(db, firestoreCollections.deedPosts));
  const photoUrl = await uploadDeedFeedPhoto(input.uid, postRef.id, input.photoSourceUri);

  const batch = writeBatch(db);
  const base = {
    authorUid: input.uid,
    authorDisplayName: input.authorDisplayName.trim() || 'Friend',
    authorProfilePicUrl: (input.authorProfilePicUrl ?? '').trim(),
    caption: input.caption.trim(),
    photoUrl,
    createdAt: serverTimestamp(),
    feedReactionsEnabled: true,
    feedCommentsEnabled: true,
  };
  const taskId = input.sourceTaskId?.trim();
  if (taskId) {
    batch.set(postRef, { ...base, sourceTaskId: taskId });
    const taskRef = doc(db, firestoreCollections.userInfo, input.uid, 'tasks', taskId);
    batch.update(taskRef, { deedFeedPostId: postRef.id });
  } else {
    batch.set(postRef, base);
  }
  await batch.commit();
  return postRef.id;
}

const ALLOWED_CARD_TINTS = new Set<string>(DEED_CARD_TINT_IDS);

export type DeedPostAuthorSettingsPatch = {
  cardTintId?: DeedCardTintId | null;
  feedReactionsEnabled?: boolean;
  feedCommentsEnabled?: boolean;
};

export async function updateDeedPostAuthorSettings(
  uid: string,
  postId: string,
  patch: DeedPostAuthorSettingsPatch,
): Promise<void> {
  const db = getFirebaseFirestore();
  const postRef = doc(db, firestoreCollections.deedPosts, postId);
  const snap = await getDoc(postRef);
  if (!snap.exists()) {
    throw new Error('Post not found.');
  }
  const data = snap.data();
  if (String(data?.authorUid ?? '') !== uid) {
    throw new Error('You can only edit your own posts.');
  }

  const updates: Record<string, unknown> = {};
  if ('cardTintId' in patch) {
    const cardTintId = patch.cardTintId;
    if (cardTintId != null && !ALLOWED_CARD_TINTS.has(cardTintId)) {
      throw new Error('Invalid card color.');
    }
    updates.cardTintId = cardTintId == null ? deleteField() : cardTintId;
  }
  if ('feedReactionsEnabled' in patch) {
    updates.feedReactionsEnabled = Boolean(patch.feedReactionsEnabled);
  }
  if ('feedCommentsEnabled' in patch) {
    updates.feedCommentsEnabled = Boolean(patch.feedCommentsEnabled);
  }
  if (Object.keys(updates).length === 0) {
    return;
  }
  await updateDoc(postRef, updates);
}

/** @deprecated Use {@link updateDeedPostAuthorSettings} */
export async function updateDeedPostCardTint(uid: string, postId: string, cardTintId: DeedCardTintId | null): Promise<void> {
  await updateDeedPostAuthorSettings(uid, postId, { cardTintId });
}

export async function deleteDeedPostForViewer(uid: string, postId: string): Promise<void> {
  const db = getFirebaseFirestore();
  const postRef = doc(db, firestoreCollections.deedPosts, postId);
  const snap = await getDoc(postRef);
  if (!snap.exists()) {
    return;
  }
  const data = snap.data();
  if (String(data.authorUid ?? '') !== uid) {
    throw new Error('You can only delete your own posts.');
  }
  const sourceTaskId = typeof data.sourceTaskId === 'string' ? data.sourceTaskId.trim() : '';

  const reactionsSnap = await getDocs(collection(db, firestoreCollections.deedPosts, postId, 'reactions'));
  const commentsSnap = await getDocs(collection(db, firestoreCollections.deedPosts, postId, 'comments'));
  let batch = writeBatch(db);
  let ops = 0;
  const flush = async () => {
    if (ops === 0) {
      return;
    }
    await batch.commit();
    batch = writeBatch(db);
    ops = 0;
  };
  for (const d of reactionsSnap.docs) {
    batch.delete(d.ref);
    ops += 1;
    if (ops >= 400) {
      await flush();
    }
  }
  for (const d of commentsSnap.docs) {
    batch.delete(d.ref);
    ops += 1;
    if (ops >= 400) {
      await flush();
    }
  }
  await flush();

  await deleteDeedFeedPhotoObject(uid, postId);
  await deleteDoc(postRef);

  if (sourceTaskId) {
    try {
      await clearTaskDeedFeedPostId(uid, sourceTaskId);
    } catch {
      /* task row may be gone */
    }
  }
}
