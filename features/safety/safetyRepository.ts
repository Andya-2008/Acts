import { addDoc, arrayRemove, arrayUnion, collection, doc, serverTimestamp, updateDoc, writeBatch } from 'firebase/firestore';

import { applyMutualFriendshipClearToBatch } from '@/features/friends/services/friendsRepository';
import { firestoreCollections } from '@/shared/config/firestore';
import { getFirebaseFirestore } from '@/shared/services/firebase/client';

export async function blockUser(viewerUid: string, blockedUid: string): Promise<void> {
  const viewer = viewerUid.trim();
  const blocked = blockedUid.trim();
  if (!viewer || !blocked || viewer === blocked) {
    return;
  }
  const db = getFirebaseFirestore();
  const batch = writeBatch(db);
  applyMutualFriendshipClearToBatch(batch, db, viewer, blocked);
  batch.update(doc(db, firestoreCollections.userInfo, viewer), {
    BlockedUids: arrayUnion(blocked),
  });
  await batch.commit();
}

export async function unblockUser(viewerUid: string, blockedUid: string): Promise<void> {
  const viewer = viewerUid.trim();
  const blocked = blockedUid.trim();
  if (!viewer || !blocked) {
    return;
  }
  const db = getFirebaseFirestore();
  await updateDoc(doc(db, firestoreCollections.userInfo, viewer), {
    BlockedUids: arrayRemove(blocked),
  });
}

export async function submitDeedReport(input: {
  reporterUid: string;
  postId: string;
  authorUid: string;
  reason: string;
}): Promise<void> {
  const db = getFirebaseFirestore();
  const reason = input.reason.trim().slice(0, 500);
  if (reason.length === 0) {
    throw new Error('Report reason is required');
  }
  await addDoc(collection(db, firestoreCollections.deedReports), {
    reporterUid: input.reporterUid.trim(),
    postId: input.postId.trim(),
    authorUid: input.authorUid.trim(),
    reason,
    createdAt: serverTimestamp(),
  });
}
