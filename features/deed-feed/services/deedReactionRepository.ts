import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore';

import { DEED_REACTION_KINDS } from '@/shared/constants/deedReactions';
import { firestoreCollections } from '@/shared/config/firestore';
import { getFirebaseFirestore } from '@/shared/services/firebase/client';
import type { DeedReactionKind, DeedReactionSummary } from '@/shared/types/deedReaction';

function emptySummary(): DeedReactionSummary {
  return {
    counts: { heart: 0, clap: 0, sparkle: 0, hug: 0, star: 0 },
    mine: null,
  };
}

function isKind(v: unknown): v is DeedReactionKind {
  return typeof v === 'string' && (DEED_REACTION_KINDS as readonly string[]).includes(v);
}

function reactionsCol(db: ReturnType<typeof getFirebaseFirestore>, postId: string) {
  return collection(db, firestoreCollections.deedPosts, postId, 'reactions');
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

export async function setDeedReaction(
  viewerUid: string,
  postId: string,
  kind: DeedReactionKind,
): Promise<void> {
  const db = getFirebaseFirestore();
  const ref = doc(db, firestoreCollections.deedPosts, postId, 'reactions', viewerUid);
  await setDoc(ref, {
    reactorUid: viewerUid,
    kind,
    createdAt: serverTimestamp(),
  });
}

export async function clearDeedReaction(viewerUid: string, postId: string): Promise<void> {
  const db = getFirebaseFirestore();
  const ref = doc(db, firestoreCollections.deedPosts, postId, 'reactions', viewerUid);
  await deleteDoc(ref);
}
