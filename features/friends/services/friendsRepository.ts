import {
  collection,
  doc,
  getDoc,
  getDocs,
  serverTimestamp,
  writeBatch,
  type Firestore,
  type WriteBatch,
} from 'firebase/firestore';

import { tryGrantInviteRewardsOnNewFriendship } from '@/features/friends/services/inviteRewardService';
import {
  emailKeyDocId,
  fetchRegisteredUserByKeyDocId,
  normalizeEmailKey,
  normalizePhoneKey,
  phoneKeyDocId,
} from '@/features/friends/services/registeredContactKeysRepository';
import { normalizeUsernameKey } from '@/shared/utils/usernameKey';
import { fetchProfilePicUrlsForUids, fetchUserInfo } from '@/features/user-profile/services/userInfoRepository';
import { firestoreCollections } from '@/shared/config/firestore';
import { getFirebaseFirestore } from '@/shared/services/firebase/client';
import type { FriendEdgeDoc, FriendRequestIncomingDoc, FriendRequestOutgoingDoc } from '@/shared/types/friends';

const INCOMING = 'friendRequestsIncoming';
const OUTGOING = 'friendRequestsOutgoing';
const FRIENDS = 'friends';

function userInfoCol(db: Firestore) {
  return collection(db, firestoreCollections.userInfo);
}

function incomingRef(db: Firestore, toUid: string, fromUid: string) {
  return doc(userInfoCol(db), toUid, INCOMING, fromUid);
}

function outgoingRef(db: Firestore, fromUid: string, toUid: string) {
  return doc(userInfoCol(db), fromUid, OUTGOING, toUid);
}

function friendEdgeRef(db: Firestore, ownerUid: string, friendUid: string) {
  return doc(userInfoCol(db), ownerUid, FRIENDS, friendUid);
}

export async function lookupUidByUsername(username: string): Promise<string | null> {
  const db = getFirebaseFirestore();
  const key = normalizeUsernameKey(username);
  if (key.length < 3) {
    return null;
  }
  const snap = await getDoc(doc(db, firestoreCollections.usernames, key));
  if (!snap.exists()) {
    return null;
  }
  const userId = (snap.data() as { userId?: string }).userId;
  return typeof userId === 'string' ? userId : null;
}

function looksLikeEmailAttempt(raw: string): boolean {
  return raw.trim().includes('@');
}

/** Resolves username, email, or phone (last 10 digits) to a user's uid. */
export async function lookupUidByFriendIdentifier(identifier: string): Promise<string | null> {
  const raw = identifier.trim();
  if (!raw) {
    return null;
  }

  if (looksLikeEmailAttempt(raw)) {
    const emailKey = normalizeEmailKey(raw);
    if (!emailKey) {
      return null;
    }
    const reg = await fetchRegisteredUserByKeyDocId(emailKeyDocId(emailKey));
    return reg?.uid ?? null;
  }

  const digitsOnly = raw.replace(/\D/g, '');
  if (digitsOnly.length >= 10) {
    const phoneKey = normalizePhoneKey(raw);
    if (!phoneKey) {
      return null;
    }
    const reg = await fetchRegisteredUserByKeyDocId(phoneKeyDocId(phoneKey));
    return reg?.uid ?? null;
  }

  return lookupUidByUsername(raw.replace(/^@+/, ''));
}

export type IncomingFriendRequest = {
  fromUid: string;
  createdAt: FriendRequestIncomingDoc['createdAt'];
};

export type OutgoingFriendRequest = {
  toUid: string;
  createdAt: FriendRequestOutgoingDoc['createdAt'];
};

export type FriendListItem = FriendEdgeDoc;

export type FriendshipRelation = 'self' | 'friends' | 'incoming_pending' | 'outgoing_pending' | 'none';

export async function fetchFriendshipRelation(meUid: string, profileUid: string): Promise<FriendshipRelation> {
  if (meUid === profileUid) {
    return 'self';
  }
  const db = getFirebaseFirestore();
  const [friendSnap, incomingSnap, outgoingSnap] = await Promise.all([
    getDoc(friendEdgeRef(db, meUid, profileUid)),
    getDoc(incomingRef(db, meUid, profileUid)),
    getDoc(outgoingRef(db, meUid, profileUid)),
  ]);
  if (friendSnap.exists()) {
    return 'friends';
  }
  if (incomingSnap.exists()) {
    return 'incoming_pending';
  }
  if (outgoingSnap.exists()) {
    return 'outgoing_pending';
  }
  return 'none';
}

/** Send a friend request when you already know the recipient uid (e.g. from their profile). */
export async function sendFriendRequestToUid(fromUid: string, toUid: string): Promise<void> {
  const db = getFirebaseFirestore();
  if (toUid === fromUid) {
    throw new Error('You cannot send a friend request to yourself.');
  }

  const existingFriend = await getDoc(friendEdgeRef(db, fromUid, toUid));
  if (existingFriend.exists()) {
    throw new Error('You are already friends with this person.');
  }

  const outgoingSnap = await getDoc(outgoingRef(db, fromUid, toUid));
  if (outgoingSnap.exists()) {
    throw new Error('A friend request is already pending.');
  }

  const incomingSnap = await getDoc(incomingRef(db, fromUid, toUid));
  if (incomingSnap.exists()) {
    throw new Error('This person already sent you a request. Accept it from your Friends list.');
  }

  const batch = writeBatch(db);
  batch.set(incomingRef(db, toUid, fromUid), {
    fromUid,
    status: 'pending',
    createdAt: serverTimestamp(),
  });
  batch.set(outgoingRef(db, fromUid, toUid), {
    toUid,
    status: 'pending',
    createdAt: serverTimestamp(),
  });
  await batch.commit();
}

export async function fetchIncomingFriendRequests(uid: string): Promise<IncomingFriendRequest[]> {
  const db = getFirebaseFirestore();
  const col = collection(db, firestoreCollections.userInfo, uid, INCOMING);
  const snap = await getDocs(col);
  return snap.docs
    .map((d) => {
      const data = d.data() as FriendRequestIncomingDoc;
      if (data.status !== 'pending') {
        return null;
      }
      return { fromUid: data.fromUid, createdAt: data.createdAt ?? null };
    })
    .filter((x): x is IncomingFriendRequest => x != null);
}

export async function fetchOutgoingFriendRequests(uid: string): Promise<OutgoingFriendRequest[]> {
  const db = getFirebaseFirestore();
  const col = collection(db, firestoreCollections.userInfo, uid, OUTGOING);
  const snap = await getDocs(col);
  return snap.docs
    .map((d) => {
      const data = d.data() as FriendRequestOutgoingDoc;
      if (data.status !== 'pending') {
        return null;
      }
      return { toUid: data.toUid, createdAt: data.createdAt ?? null };
    })
    .filter((x): x is OutgoingFriendRequest => x != null);
}

/** Every accepted friend edge id (`friendUid`), for queries like the deed feed. */
export async function fetchFriendUids(uid: string): Promise<string[]> {
  const db = getFirebaseFirestore();
  const col = collection(db, firestoreCollections.userInfo, uid, FRIENDS);
  const snap = await getDocs(col);
  return snap.docs.map((d) => d.id).filter((id) => id.length > 0);
}

export async function fetchFriends(uid: string): Promise<FriendListItem[]> {
  const db = getFirebaseFirestore();
  const col = collection(db, firestoreCollections.userInfo, uid, FRIENDS);
  const snap = await getDocs(col);
  return snap.docs
    .map((d) => {
      const data = d.data() as FriendEdgeDoc;
      /** Subcollection doc id is always `userInfo/{uid}/friends/{friendUid}`; some legacy docs omit `friendUid` in payload. */
      return { ...data, friendUid: d.id };
    })
    .filter((f) => {
      const username = (f.Username ?? '').trim();
      const displayName = [f.First, f.Last].filter(Boolean).join(' ').trim();
      return username.length > 0 || displayName.length > 0;
    });
}

export type MutualFriendSummary = {
  friendUid: string;
  displayName: string;
  usernameLabel: string | null;
  /** Username (no @), lowercased for compact inline copy. */
  boldHandle: string;
  profilePicUrl: string | null;
};

function boldLabelFromEdge(f: FriendListItem): string {
  const raw = (f.Username ?? '').trim().replace(/^@+/, '');
  if (raw.length > 0) {
    return raw.toLowerCase();
  }
  const full = [f.First, f.Last].filter(Boolean).join(' ').trim();
  if (full.length > 0) {
    const first = full.split(/\s+/)[0];
    return (first ?? full).toLowerCase();
  }
  return 'friend';
}

function mutualDisplayFromEdge(f: FriendListItem): Pick<MutualFriendSummary, 'displayName' | 'usernameLabel'> {
  const full = [f.First, f.Last].filter(Boolean).join(' ').trim();
  const rawU = (f.Username ?? '').trim();
  const usernameLabel = rawU ? `@${rawU.replace(/^@+/, '')}` : null;
  if (full.length > 0) {
    return { displayName: full, usernameLabel };
  }
  if (usernameLabel) {
    return { displayName: usernameLabel, usernameLabel: null };
  }
  return { displayName: 'Acts member', usernameLabel: null };
}

/** Friends you share with `profileUid` (requires read access to both friend lists). */
export async function fetchMutualFriends(meUid: string, profileUid: string): Promise<MutualFriendSummary[]> {
  if (meUid === profileUid) {
    return [];
  }
  const [mine, theirs] = await Promise.all([fetchFriends(meUid), fetchFriends(profileUid)]);
  const theirIds = new Set(theirs.map((t) => t.friendUid));
  const mutual = mine.filter((m) => theirIds.has(m.friendUid));
  const sorted = mutual
    .map((m) => ({
      friendUid: m.friendUid,
      boldHandle: boldLabelFromEdge(m),
      ...mutualDisplayFromEdge(m),
      profilePicUrl: null,
    }))
    .sort((a, b) => a.displayName.localeCompare(b.displayName, undefined, { sensitivity: 'base' }));
  if (sorted.length === 0) {
    return [];
  }
  const pics = await fetchProfilePicUrlsForUids(sorted.map((s) => s.friendUid));
  return sorted.map((s) => ({ ...s, profilePicUrl: pics[s.friendUid] ?? null }));
}

export async function sendFriendRequest(fromUid: string, identifierRaw: string): Promise<void> {
  const db = getFirebaseFirestore();
  const toUid = await lookupUidByFriendIdentifier(identifierRaw);
  if (!toUid) {
    throw new Error('FRIEND_LOOKUP_NOT_FOUND');
  }
  if (toUid === fromUid) {
    throw new Error('You cannot send a friend request to yourself.');
  }

  const existingFriend = await getDoc(friendEdgeRef(db, fromUid, toUid));
  if (existingFriend.exists()) {
    throw new Error('You are already friends with this person.');
  }

  /** Must not read `toUid`'s incoming subcollection - rules only allow the recipient to read it. */
  const outgoingSnap = await getDoc(outgoingRef(db, fromUid, toUid));
  if (outgoingSnap.exists()) {
    throw new Error('A friend request is already pending.');
  }

  await sendFriendRequestToUid(fromUid, toUid);
}

export async function acceptFriendRequest(recipientUid: string, fromUid: string): Promise<void> {
  const db = getFirebaseFirestore();
  if (fromUid === recipientUid) {
    throw new Error('Invalid request.');
  }

  const incomingSnap = await getDoc(incomingRef(db, recipientUid, fromUid));
  if (!incomingSnap.exists()) {
    throw new Error('That request is no longer available.');
  }

  const [fromProfile, toProfile] = await Promise.all([fetchUserInfo(fromUid), fetchUserInfo(recipientUid)]);
  if (!fromProfile || !toProfile) {
    throw new Error('Could not load profiles to complete the request.');
  }

  const batch = writeBatch(db);
  batch.delete(incomingRef(db, recipientUid, fromUid));
  batch.delete(outgoingRef(db, fromUid, recipientUid));

  const edgeToRecipient: FriendEdgeDoc = {
    friendUid: recipientUid,
    Username: String(toProfile.Username ?? ''),
    First: String(toProfile.First ?? ''),
    Last: String(toProfile.Last ?? ''),
    since: null,
  };
  const edgeToSender: FriendEdgeDoc = {
    friendUid: fromUid,
    Username: String(fromProfile.Username ?? ''),
    First: String(fromProfile.First ?? ''),
    Last: String(fromProfile.Last ?? ''),
    since: null,
  };

  batch.set(friendEdgeRef(db, fromUid, recipientUid), { ...edgeToRecipient, since: serverTimestamp() });
  batch.set(friendEdgeRef(db, recipientUid, fromUid), { ...edgeToSender, since: serverTimestamp() });

  await batch.commit();

  await tryGrantInviteRewardsOnNewFriendship(fromUid, recipientUid);
}

export async function declineFriendRequest(recipientUid: string, fromUid: string): Promise<void> {
  const db = getFirebaseFirestore();
  const batch = writeBatch(db);
  batch.delete(incomingRef(db, recipientUid, fromUid));
  batch.delete(outgoingRef(db, fromUid, recipientUid));
  await batch.commit();
}

export async function cancelOutgoingFriendRequest(fromUid: string, toUid: string): Promise<void> {
  const db = getFirebaseFirestore();
  const batch = writeBatch(db);
  batch.delete(outgoingRef(db, fromUid, toUid));
  batch.delete(incomingRef(db, toUid, fromUid));
  await batch.commit();
}

/** Deletes the friendship edge for both users (symmetric `friends` subdocs). */
export async function removeFriend(myUid: string, friendUid: string): Promise<void> {
  const db = getFirebaseFirestore();
  if (myUid === friendUid) {
    throw new Error('Invalid friend remove.');
  }
  const batch = writeBatch(db);
  batch.delete(friendEdgeRef(db, myUid, friendUid));
  batch.delete(friendEdgeRef(db, friendUid, myUid));
  await batch.commit();
}

/** Queues deletes for mutual `friends` edges and any pending request docs between two users. */
export function applyMutualFriendshipClearToBatch(batch: WriteBatch, db: Firestore, aUid: string, bUid: string): void {
  const a = aUid.trim();
  const b = bUid.trim();
  if (!a || !b || a === b) {
    return;
  }
  batch.delete(friendEdgeRef(db, a, b));
  batch.delete(friendEdgeRef(db, b, a));
  batch.delete(incomingRef(db, a, b));
  batch.delete(outgoingRef(db, b, a));
  batch.delete(outgoingRef(db, a, b));
  batch.delete(incomingRef(db, b, a));
}

/**
 * Removes mutual `friends` edges and any pending request pair between two users.
 * Used when blocking so the relationship does not stay in a “friends but blocked” state.
 */
export async function clearMutualFriendEdgesAndRequestsBetween(aUid: string, bUid: string): Promise<void> {
  const a = aUid.trim();
  const b = bUid.trim();
  if (!a || !b || a === b) {
    return;
  }
  const db = getFirebaseFirestore();
  const batch = writeBatch(db);
  applyMutualFriendshipClearToBatch(batch, db, a, b);
  await batch.commit();
}
