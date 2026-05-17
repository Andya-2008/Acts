import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
} from 'firebase/firestore';

import { firestoreCollections } from '@/shared/config/firestore';
import { getFirebaseFirestore } from '@/shared/services/firebase/client';
import type { DeedComment } from '@/shared/types/deedComment';

const COMMENT_MAX = 500;
const FETCH_LIMIT = 80;

function commentsCol(db: ReturnType<typeof getFirebaseFirestore>, postId: string) {
  return collection(db, firestoreCollections.deedPosts, postId, 'comments');
}

function parseComment(id: string, data: Record<string, unknown>): DeedComment {
  return {
    id,
    authorUid: String(data.authorUid ?? ''),
    text: String(data.text ?? ''),
    createdAt: (data.createdAt as DeedComment['createdAt']) ?? null,
  };
}

export async function fetchCommentsForPost(postId: string): Promise<DeedComment[]> {
  const db = getFirebaseFirestore();
  const q = query(commentsCol(db, postId), orderBy('createdAt', 'asc'), limit(FETCH_LIMIT));
  const snap = await getDocs(q);
  return snap.docs.map((d) => parseComment(d.id, d.data()));
}

export async function fetchCommentsByPostIds(postIds: string[]): Promise<Record<string, DeedComment[]>> {
  const unique = [...new Set(postIds.filter(Boolean))];
  const out: Record<string, DeedComment[]> = {};
  await Promise.all(
    unique.map(async (id) => {
      out[id] = await fetchCommentsForPost(id);
    }),
  );
  return out;
}

export async function addDeedComment(postId: string, authorUid: string, text: string): Promise<string> {
  const trimmed = text.trim().slice(0, COMMENT_MAX);
  if (trimmed.length === 0) {
    throw new Error('Comment cannot be empty.');
  }
  const db = getFirebaseFirestore();
  const ref = await addDoc(commentsCol(db, postId), {
    authorUid,
    text: trimmed,
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

export async function deleteDeedComment(postId: string, commentId: string, viewerUid: string): Promise<void> {
  const db = getFirebaseFirestore();
  const postRef = doc(db, firestoreCollections.deedPosts, postId);
  const postSnap = await getDoc(postRef);
  if (!postSnap.exists()) {
    return;
  }
  const postAuthor = String(postSnap.data()?.authorUid ?? '');
  const cref = doc(db, firestoreCollections.deedPosts, postId, 'comments', commentId);
  const csnap = await getDoc(cref);
  if (!csnap.exists()) {
    return;
  }
  const cAuthor = String(csnap.data()?.authorUid ?? '');
  if (cAuthor !== viewerUid && postAuthor !== viewerUid) {
    throw new Error('You cannot delete this comment.');
  }
  await deleteDoc(cref);
}
