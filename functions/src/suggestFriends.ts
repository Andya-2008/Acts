import { FieldPath, getFirestore } from 'firebase-admin/firestore';
import { HttpsError, onCall } from 'firebase-functions/v2/https';

const SUGGESTION_COUNT = 3;
const MAX_FRIENDS_SCAN = 24;
const MAX_CLIENT_EXCLUDE = 80;

type UserInfoLite = {
  Username?: string;
  First?: string;
  Last?: string;
  profilePicUrl?: string;
  BlockedUids?: string[];
};

function db() {
  return getFirestore();
}

function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function mutualReasonText(count: number): string {
  if (count <= 0) {
    return 'On Acts';
  }
  if (count === 1) {
    return '1 mutual friend';
  }
  return `${count} mutual friends`;
}

async function getFriendUids(uid: string): Promise<string[]> {
  const snap = await db().collection('userInfo').doc(uid).collection('friends').get();
  return snap.docs.map((doc) => doc.id);
}

async function collectDiscoverableUserIds(exclude: Set<string>, target: number): Promise<string[]> {
  const found = new Set<string>();
  const pageSize = 120;
  let lastId: string | undefined;

  for (let page = 0; page < 8 && found.size < target; page += 1) {
    let query = db()
      .collection('userInfo')
      .orderBy(FieldPath.documentId())
      .limit(pageSize);
    if (lastId) {
      query = query.startAfter(lastId);
    }
    const snap = await query.select().get();
    if (snap.empty) {
      break;
    }
    for (const doc of snap.docs) {
      if (!exclude.has(doc.id)) {
        found.add(doc.id);
      }
    }
    lastId = snap.docs[snap.docs.length - 1]!.id;
    if (snap.size < pageSize) {
      break;
    }
  }

  return shuffle([...found]).slice(0, target);
}

function orderCandidatesByMutual(mutualCounts: Map<string, number>, exclude: Set<string>): string[] {
  const byMutual = new Map<number, string[]>();
  for (const [uid, count] of mutualCounts.entries()) {
    if (exclude.has(uid)) {
      continue;
    }
    const bucket = byMutual.get(count) ?? [];
    bucket.push(uid);
    byMutual.set(count, bucket);
  }

  const ordered: string[] = [];
  for (const count of [...byMutual.keys()].sort((a, b) => b - a)) {
    ordered.push(...shuffle(byMutual.get(count)!));
  }
  return ordered;
}

/** Returns three discoverable users, prioritizing the highest mutual-friend counts. */
export const suggestFriends = onCall({ invoker: 'public', maxInstances: 10 }, async (request) => {
  if (!request.auth?.uid) {
    throw new HttpsError('unauthenticated', 'SUGGEST_FRIENDS_AUTH');
  }

  const uid = request.auth.uid;
  const excludeFromClient = Array.isArray(request.data?.excludeUids)
    ? (request.data.excludeUids as unknown[])
        .filter((value): value is string => typeof value === 'string' && value.length > 0)
        .slice(0, MAX_CLIENT_EXCLUDE)
    : [];

  const [myFriends, incomingSnap, outgoingSnap, myInfoSnap] = await Promise.all([
    getFriendUids(uid),
    db().collection('userInfo').doc(uid).collection('friendRequestsIncoming').get(),
    db().collection('userInfo').doc(uid).collection('friendRequestsOutgoing').get(),
    db().collection('userInfo').doc(uid).get(),
  ]);

  const myInfo = myInfoSnap.data() as UserInfoLite | undefined;
  const blockedByMe = new Set(Array.isArray(myInfo?.BlockedUids) ? myInfo!.BlockedUids! : []);

  const coreExclude = new Set<string>([
    uid,
    ...myFriends,
    ...incomingSnap.docs.map((doc) => doc.id),
    ...outgoingSnap.docs.map((doc) => doc.id),
    ...blockedByMe,
  ]);

  const excludeWithRecent = new Set<string>([...coreExclude, ...excludeFromClient]);
  const mutualCounts = new Map<string, number>();

  const friendsToScan = shuffle(myFriends).slice(0, MAX_FRIENDS_SCAN);
  await Promise.all(
    friendsToScan.map(async (friendUid) => {
      const theirFriends = await getFriendUids(friendUid);
      for (const candidateUid of theirFriends) {
        if (coreExclude.has(candidateUid)) {
          continue;
        }
        mutualCounts.set(candidateUid, (mutualCounts.get(candidateUid) ?? 0) + 1);
      }
    }),
  );

  const randomIds = await collectDiscoverableUserIds(excludeWithRecent, 90);
  for (const candidateUid of randomIds) {
    if (!mutualCounts.has(candidateUid)) {
      mutualCounts.set(candidateUid, 0);
    }
  }

  let ordered = orderCandidatesByMutual(mutualCounts, excludeWithRecent);
  let picked = ordered.slice(0, SUGGESTION_COUNT);

  if (picked.length < SUGGESTION_COUNT && excludeFromClient.length > 0) {
    ordered = orderCandidatesByMutual(mutualCounts, coreExclude);
    picked = ordered.slice(0, SUGGESTION_COUNT);
  }

  const profiles = await Promise.all(
    picked.map(async (candidateUid) => {
      const snap = await db().collection('userInfo').doc(candidateUid).get();
      return { uid: candidateUid, data: snap.data() as UserInfoLite | undefined };
    }),
  );

  const suggestions = profiles
    .filter((row) => row.data)
    .map((row) => {
      const mutualCount = mutualCounts.get(row.uid) ?? 0;
      return {
        uid: row.uid,
        username: String(row.data!.Username ?? '').trim(),
        first: String(row.data!.First ?? '').trim(),
        last: String(row.data!.Last ?? '').trim(),
        profilePicUrl: row.data!.profilePicUrl?.trim() || null,
        mutualCount,
        reasonText: mutualReasonText(mutualCount),
      };
    });

  return { suggestions };
});
