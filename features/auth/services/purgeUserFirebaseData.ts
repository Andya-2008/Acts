import {
  collection,
  collectionGroup,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  writeBatch,
  type DocumentReference,
} from 'firebase/firestore';
import { deleteObject, listAll, ref } from 'firebase/storage';

import { deleteDeedPostForViewer } from '@/features/deed-feed/services/deedPostRepository';
import {
  clearMutualFriendEdgesAndRequestsBetween,
  fetchFriendUids,
  fetchIncomingFriendRequests,
  fetchOutgoingFriendRequests,
} from '@/features/friends/services/friendsRepository';
import {
  emailKeyDocId,
  normalizeEmailKey,
  normalizePhoneKey,
  phoneKeyDocId,
} from '@/features/friends/services/registeredContactKeysRepository';
import { fetchUserInfo } from '@/features/user-profile/services/userInfoRepository';
import { firestoreCollections } from '@/shared/config/firestore';
import { getFirebaseFirestore, getFirebaseStorage } from '@/shared/services/firebase/client';
import { deleteTaskPhotoObject } from '@/shared/services/firebase/storageUploads';
import { normalizeUsernameKey } from '@/shared/utils/usernameKey';

const BATCH_LIMIT = 400;

const USER_SUBCOLLECTIONS = ['friends', 'friendRequestsIncoming', 'friendRequestsOutgoing', 'tasks'] as const;

async function commitDeletes(refs: DocumentReference[]): Promise<void> {
  if (refs.length === 0) {
    return;
  }
  const db = getFirebaseFirestore();
  let batch = writeBatch(db);
  let ops = 0;
  for (const r of refs) {
    batch.delete(r);
    ops += 1;
    if (ops >= BATCH_LIMIT) {
      await batch.commit();
      batch = writeBatch(db);
      ops = 0;
    }
  }
  if (ops > 0) {
    await batch.commit();
  }
}

async function deleteSubcollection(uid: string, sub: (typeof USER_SUBCOLLECTIONS)[number]): Promise<void> {
  const db = getFirebaseFirestore();
  const snap = await getDocs(collection(db, firestoreCollections.userInfo, uid, sub));
  await commitDeletes(snap.docs.map((d) => d.ref));
}

async function purgeSocialGraph(uid: string): Promise<void> {
  const [friends, incoming, outgoing] = await Promise.all([
    fetchFriendUids(uid),
    fetchIncomingFriendRequests(uid),
    fetchOutgoingFriendRequests(uid),
  ]);
  const others = new Set<string>();
  for (const id of friends) {
    others.add(id);
  }
  for (const r of incoming) {
    others.add(r.fromUid);
  }
  for (const r of outgoing) {
    others.add(r.toUid);
  }
  for (const other of others) {
    await clearMutualFriendEdgesAndRequestsBetween(uid, other);
  }
  for (const sub of USER_SUBCOLLECTIONS) {
    await deleteSubcollection(uid, sub);
  }
}

async function purgeDeedPosts(uid: string): Promise<void> {
  const db = getFirebaseFirestore();
  const snap = await getDocs(
    query(collection(db, firestoreCollections.deedPosts), where('authorUid', '==', uid)),
  );
  for (const d of snap.docs) {
    await deleteDeedPostForViewer(uid, d.id);
  }
}

async function purgeCommentsAndReactionsOnOthersPosts(uid: string): Promise<void> {
  const db = getFirebaseFirestore();
  const [commentsSnap, reactionsSnap] = await Promise.all([
    getDocs(query(collectionGroup(db, 'comments'), where('authorUid', '==', uid))),
    getDocs(query(collectionGroup(db, 'reactions'), where('reactorUid', '==', uid))),
  ]);
  await commitDeletes([
    ...commentsSnap.docs.map((d) => d.ref),
    ...reactionsSnap.docs.map((d) => d.ref),
  ]);
}

async function purgeLookupDocs(
  uid: string,
  profile: { Email?: string; Phone?: string; Username?: string } | null,
): Promise<void> {
  if (!profile) {
    return;
  }
  const db = getFirebaseFirestore();
  const refs: DocumentReference[] = [];

  const usernameKey = normalizeUsernameKey(profile.Username ?? '');
  if (usernameKey.length >= 3) {
    const uRef = doc(db, firestoreCollections.usernames, usernameKey);
    const uSnap = await getDoc(uRef);
    if (uSnap.exists() && (uSnap.data() as { userId?: string }).userId === uid) {
      refs.push(uRef);
    }
  }

  const emailNorm = normalizeEmailKey(profile.Email ?? '');
  if (emailNorm) {
    const eRef = doc(db, firestoreCollections.registeredContactKeys, emailKeyDocId(emailNorm));
    const eSnap = await getDoc(eRef);
    if (eSnap.exists() && (eSnap.data() as { uid?: string }).uid === uid) {
      refs.push(eRef);
    }
  }

  const phoneNorm = profile.Phone ? normalizePhoneKey(profile.Phone) : null;
  if (phoneNorm) {
    const pRef = doc(db, firestoreCollections.registeredContactKeys, phoneKeyDocId(phoneNorm));
    const pSnap = await getDoc(pRef);
    if (pSnap.exists() && (pSnap.data() as { uid?: string }).uid === uid) {
      refs.push(pRef);
    }
    const loginRef = doc(db, firestoreCollections.phoneLoginLookup, phoneKeyDocId(phoneNorm));
    const loginSnap = await getDoc(loginRef);
    if (loginSnap.exists() && (loginSnap.data() as { uid?: string }).uid === uid) {
      refs.push(loginRef);
    }
  }

  await commitDeletes(refs);
}

async function purgeDeedReportsByReporter(uid: string): Promise<void> {
  const db = getFirebaseFirestore();
  const snap = await getDocs(
    query(collection(db, firestoreCollections.deedReports), where('reporterUid', '==', uid)),
  );
  await commitDeletes(snap.docs.map((d) => d.ref));
}

async function purgeStorageObjects(uid: string, taskDocIds: string[]): Promise<void> {
  const storage = getFirebaseStorage();
  try {
    await deleteObject(ref(storage, `profile_pictures/${uid}.png`));
  } catch {
    /* missing */
  }
  await Promise.all(taskDocIds.map((taskId) => deleteTaskPhotoObject(uid, taskId)));
  try {
    const folder = ref(storage, `deed_feed_photos/${uid}`);
    const listing = await listAll(folder);
    await Promise.all(listing.items.map((item) => deleteObject(item).catch(() => {})));
  } catch {
    /* prefix missing */
  }
}

/**
 * Removes Firestore + Storage data for `uid` while the user is still signed in.
 * Call before `deleteUser` on Firebase Auth.
 */
async function runPurgeStep(label: string, fn: () => Promise<void>): Promise<void> {
  try {
    await fn();
  } catch (e) {
    const detail = e instanceof Error ? e.message : String(e);
    throw new Error(`Account deletion failed while ${label}: ${detail}`);
  }
}

export async function purgeUserFirebaseData(uid: string): Promise<void> {
  const db = getFirebaseFirestore();
  const profile = await fetchUserInfo(uid);

  const tasksSnap = await getDocs(collection(db, firestoreCollections.userInfo, uid, 'tasks'));
  const taskDocIds = tasksSnap.docs.map((d) => d.id);

  await runPurgeStep('removing your deed posts', () => purgeDeedPosts(uid));
  await runPurgeStep('removing your comments and reactions', () => purgeCommentsAndReactionsOnOthersPosts(uid));
  await runPurgeStep('removing friends and requests', () => purgeSocialGraph(uid));
  await runPurgeStep('removing username and contact lookups', () => purgeLookupDocs(uid, profile));
  await runPurgeStep('removing your reports', () => purgeDeedReportsByReporter(uid));
  await runPurgeStep('removing photos', () => purgeStorageObjects(uid, taskDocIds));
  await runPurgeStep('removing your profile', () =>
    deleteDoc(doc(db, firestoreCollections.userInfo, uid)),
  );
}
