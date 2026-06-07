import { collection, getDocs } from 'firebase/firestore';

import type { ContactOnActsMatch } from '@/features/friends/hooks/useContactsOnActsMatches';
import {
  fetchFriendUids,
  fetchFriends,
  fetchIncomingFriendRequests,
  fetchOutgoingFriendRequests,
} from '@/features/friends/services/friendsRepository';
import type { FriendSuggestion } from '@/features/friends/services/friendSuggestionsService';
import { fetchProfilePicUrlsForUids, fetchUserInfo } from '@/features/user-profile/services/userInfoRepository';
import { firestoreCollections } from '@/shared/config/firestore';
import { getFirebaseFirestore } from '@/shared/services/firebase/client';

const SUGGESTION_COUNT = 3;
const MAX_FRIENDS_TO_SCAN = 24;

function mutualReasonText(count: number): string {
  if (count <= 0) {
    return 'On Acts';
  }
  if (count === 1) {
    return '1 mutual friend';
  }
  return `${count} mutual friends`;
}

function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

async function fetchInviteJoinCandidateUids(inviterUid: string): Promise<string[]> {
  const db = getFirebaseFirestore();
  const snap = await getDocs(
    collection(db, firestoreCollections.userInfo, inviterUid, 'inviteJoinAlerts'),
  );
  return snap.docs.map((d) => d.id);
}

/** Client-side suggestions when the cloud function is unavailable (contacts, FoF, invite joins). */
export async function fetchFriendSuggestionsLocal(
  uid: string,
  contactMatches: ContactOnActsMatch[],
  excludeUids: string[],
): Promise<FriendSuggestion[]> {
  const [myFriends, incoming, outgoing, myProfile, inviteJoinUids] = await Promise.all([
    fetchFriendUids(uid),
    fetchIncomingFriendRequests(uid),
    fetchOutgoingFriendRequests(uid),
    fetchUserInfo(uid),
    fetchInviteJoinCandidateUids(uid),
  ]);

  const exclude = new Set<string>([
    uid,
    ...myFriends,
    ...incoming.map((r) => r.fromUid),
    ...outgoing.map((r) => r.toUid),
    ...excludeUids,
  ]);

  const mutualCounts = new Map<string, { count: number; reasonText: string }>();

  const addCandidate = (candidateUid: string, reasonText: string, mutualBoost = 0) => {
    if (exclude.has(candidateUid)) {
      return;
    }
    const prev = mutualCounts.get(candidateUid);
    if (!prev || mutualBoost > prev.count) {
      mutualCounts.set(candidateUid, {
        count: Math.max(prev?.count ?? 0, mutualBoost),
        reasonText: mutualBoost > 0 ? mutualReasonText(mutualBoost) : reasonText,
      });
    } else if (prev && prev.reasonText === 'On Acts' && reasonText !== 'On Acts') {
      prev.reasonText = reasonText;
    }
  };

  for (const joinerUid of inviteJoinUids) {
    addCandidate(joinerUid, 'Joined from your invite');
  }

  for (const match of contactMatches) {
    addCandidate(
      match.uid,
      match.matchedVia === 'phone' ? 'In your contacts · phone' : 'In your contacts',
    );
  }

  const inviterUid = myProfile?.InvitedByUid?.trim();
  if (inviterUid) {
    addCandidate(inviterUid, 'Invited you to Acts');
  }

  const friendEdges = await fetchFriends(uid);
  const scan = shuffle(friendEdges.map((e) => e.friendUid)).slice(0, MAX_FRIENDS_TO_SCAN);
  await Promise.all(
    scan.map(async (friendUid) => {
      const theirFriends = await fetchFriendUids(friendUid);
      const via =
        friendEdges.find((e) => e.friendUid === friendUid)?.Username?.trim().replace(/^@+/, '') ||
        friendEdges.find((e) => e.friendUid === friendUid)?.First?.trim() ||
        'a friend';
      for (const candidateUid of theirFriends) {
        if (exclude.has(candidateUid)) {
          continue;
        }
        const prev = mutualCounts.get(candidateUid);
        if (prev) {
          prev.count += 1;
          prev.reasonText =
            prev.count > 1
              ? `Friends with @${via} and ${prev.count - 1} other${prev.count - 1 === 1 ? '' : 's'}`
              : `Friends with @${via}`;
        } else {
          mutualCounts.set(candidateUid, {
            count: 1,
            reasonText: `Friends with @${via}`,
          });
        }
      }
    }),
  );

  const ordered = [...mutualCounts.entries()].sort((a, b) => {
    const rank = b[1].count - a[1].count;
    if (rank !== 0) {
      return rank;
    }
    return a[0].localeCompare(b[0]);
  });

  const tierGroups = new Map<number, string[]>();
  for (const [candidateUid, meta] of ordered) {
    const bucket = tierGroups.get(meta.count) ?? [];
    bucket.push(candidateUid);
    tierGroups.set(meta.count, bucket);
  }

  const picked: string[] = [];
  for (const count of [...tierGroups.keys()].sort((a, b) => b - a)) {
    picked.push(...shuffle(tierGroups.get(count)!));
    if (picked.length >= SUGGESTION_COUNT) {
      break;
    }
  }
  const limited = picked.slice(0, SUGGESTION_COUNT);

  const profiles = await Promise.all(limited.map((id) => fetchUserInfo(id)));
  const missingPics = limited.filter((id, i) => !profiles[i]?.profilePicUrl).map((id) => id);
  const pics = missingPics.length > 0 ? await fetchProfilePicUrlsForUids(missingPics) : {};

  return limited
    .map((candidateUid, i) => {
      const profile = profiles[i];
      if (!profile) {
        return null;
      }
      const meta = mutualCounts.get(candidateUid)!;
      return {
        uid: candidateUid,
        username: String(profile.Username ?? '').trim(),
        first: String(profile.First ?? '').trim(),
        last: String(profile.Last ?? '').trim(),
        profilePicUrl: profile.profilePicUrl?.trim() || pics[candidateUid] || null,
        mutualCount: meta.count,
        reasonText: meta.reasonText,
      };
    })
    .filter((s): s is FriendSuggestion => s != null);
}
