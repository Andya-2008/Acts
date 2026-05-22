import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  serverTimestamp,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import { FirebaseError } from 'firebase/app';

import { ALL_DEED_REACTION_KINDS } from '@/shared/constants/deedReactions';
import { firestoreCollections } from '@/shared/config/firestore';
import { getFirebaseFirestore } from '@/shared/services/firebase/client';
import type { DeedReactionKind, DeedReactionSummary } from '@/shared/types/deedReaction';

function emptySummary(): DeedReactionSummary {
  const counts = {} as Record<DeedReactionKind, number>;
  for (const k of ALL_DEED_REACTION_KINDS) {
    counts[k] = 0;
  }
  return { counts, mine: null };
}

function isKind(v: unknown): v is DeedReactionKind {
  return typeof v === 'string' && (ALL_DEED_REACTION_KINDS as readonly string[]).includes(v);
}

function isPermissionDenied(error: unknown): boolean {
  return error instanceof FirebaseError && error.code === 'permission-denied';
}

function reactionsCol(db: ReturnType<typeof getFirebaseFirestore>, postId: string) {
  return collection(db, firestoreCollections.deedPosts, postId, 'reactions');
}

function postReactionsEnabled(data: Record<string, unknown> | undefined): boolean {
  if (!data) {
    return true;
  }
  return data.feedReactionsEnabled !== false;
}

/** Load all reaction docs for each post id (parallel). */
export async function fetchReactionSummariesForPostIds(
  postIds: string[],
  viewerUid: string,
): Promise<Record<string, DeedReactionSummary>> {
  const out: Record<string, DeedReactionSummary> = {};
  if (postIds.length === 0) {
    return out;
  }
  const db = getFirebaseFirestore();
  await Promise.all(
    postIds.map(async (postId) => {
      const snap = await getDocs(reactionsCol(db, postId));
      const summary = emptySummary();
      for (const d of snap.docs) {
        const data = d.data();
        const kind = data.kind;
        if (!isKind(kind)) {
          continue;
        }
        summary.counts[kind] += 1;
        if (d.id === viewerUid) {
          summary.mine = kind;
        }
      }
      out[postId] = summary;
    }),
  );
  return out;
}

async function assertDeedPostReactionsEnabled(
  db: ReturnType<typeof getFirebaseFirestore>,
  postId: string,
): Promise<void> {
  const postSnap = await getDoc(doc(db, firestoreCollections.deedPosts, postId));
  if (!postSnap.exists()) {
    throw new Error('DEED_POST_NOT_FOUND');
  }
  if (!postReactionsEnabled(postSnap.data())) {
    throw new Error('FEED_REACTIONS_DISABLED');
  }
}

async function createReactionDoc(
  ref: ReturnType<typeof doc>,
  viewerUid: string,
  kind: DeedReactionKind,
): Promise<void> {
  await setDoc(ref, {
    reactorUid: viewerUid,
    kind,
    createdAt: serverTimestamp(),
  });
}

/**
 * Upsert the viewer's reaction at reactions/{viewerUid}.
 * Prefer updateDoc({ kind }) when the doc exists; repair with delete+create on permission-denied.
 */
export async function setDeedReaction(
  viewerUid: string,
  postId: string,
  kind: DeedReactionKind,
): Promise<void> {
  const db = getFirebaseFirestore();
  await assertDeedPostReactionsEnabled(db, postId);

  const ref = doc(db, firestoreCollections.deedPosts, postId, 'reactions', viewerUid);
  const existing = await getDoc(ref);

  if (!existing.exists()) {
    await createReactionDoc(ref, viewerUid, kind);
    return;
  }

  const prevKind = existing.data()?.kind;
  if (prevKind === kind) {
    return;
  }

  try {
    await updateDoc(ref, { kind });
  } catch (updateErr) {
    if (!isPermissionDenied(updateErr)) {
      throw updateErr;
    }
    await deleteDoc(ref);
    await createReactionDoc(ref, viewerUid, kind);
  }
}

export async function clearDeedReaction(viewerUid: string, postId: string): Promise<void> {
  const db = getFirebaseFirestore();
  const ref = doc(db, firestoreCollections.deedPosts, postId, 'reactions', viewerUid);
  const existing = await getDoc(ref);
  if (existing.exists()) {
    await deleteDoc(ref);
  }
}
