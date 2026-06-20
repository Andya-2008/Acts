import { collection, getDocs, limit, orderBy, query, type Timestamp } from 'firebase/firestore';

import { fetchCommentsByPostIds } from '@/features/deed-feed/services/deedCommentRepository';
import { fetchFriendsDeedPosts, fetchMyDeedPosts } from '@/features/deed-feed/services/deedPostRepository';
import { fetchFriends, fetchIncomingFriendRequests } from '@/features/friends/services/friendsRepository';
import { fetchUserInfo } from '@/features/user-profile/services/userInfoRepository';
import { firestoreCollections } from '@/shared/config/firestore';
import { getFirebaseFirestore } from '@/shared/services/firebase/client';
import type { DeedReactionKind } from '@/shared/types/deedReaction';
import type { UserInfoRead } from '@/shared/types/userInfo';

export type DerivedNotificationType =
  | 'friend_request'
  | 'friend_request_accepted'
  | 'deed_reaction'
  | 'deed_comment'
  | 'friend_post'
  | 'new_tasks';

export type DerivedNotification = {
  /** Stable composite id so read-state and lists stay consistent across refetches. */
  id: string;
  type: DerivedNotificationType;
  title: string;
  message: string;
  /** Milliseconds since epoch - sort + unread comparison. */
  timestampMs: number;
  /** Expo-router path to open when tapped. */
  route: string;
  /** Person who triggered it (for avatar lookups), when applicable. */
  actorUid?: string;
  actorPicUrl?: string;
  postId?: string;
};

/** How far back social activity stays in the inbox. */
const SOCIAL_WINDOW_MS = 30 * 24 * 60 * 60 * 1000;
/** "New" friend posts window. */
const FRIEND_POST_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;
/** "Newly assigned" tasks window. */
const NEW_TASK_WINDOW_MS = 36 * 60 * 60 * 1000;
const MY_POSTS_FOR_ACTIVITY = 12;

const REACTION_EMOJI: Record<DeedReactionKind, string> = {
  heart: '❤️',
  clap: '👏',
  sparkle: '✨',
  hug: '🤗',
  star: '⭐',
  rocket: '🚀',
  pray: '🙏',
  flame: '🔥',
  rainbow: '🌈',
  party: '🎉',
  hundred: '💯',
};

function tsToMs(ts: Timestamp | null | undefined): number {
  if (!ts) {
    return 0;
  }
  try {
    return ts.toMillis();
  } catch {
    return 0;
  }
}

function displayNameFromInfo(info: UserInfoRead | null | undefined, fallback = 'Someone'): string {
  if (!info) {
    return fallback;
  }
  const full = [info.First, info.Last].filter(Boolean).join(' ').trim();
  if (full.length > 0) {
    return full;
  }
  const u = info.Username?.trim();
  return u ? `@${u.replace(/^@+/, '')}` : fallback;
}

type ReactionRow = { postId: string; reactorUid: string; kind: DeedReactionKind; createdAtMs: number };

async function fetchReactionsForPost(postId: string): Promise<ReactionRow[]> {
  const db = getFirebaseFirestore();
  const q = query(
    collection(db, firestoreCollections.deedPosts, postId, 'reactions'),
    orderBy('createdAt', 'desc'),
    limit(30),
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => {
    const data = d.data() as { reactorUid?: string; kind?: string; createdAt?: Timestamp | null };
    return {
      postId,
      reactorUid: String(data.reactorUid ?? d.id),
      kind: (data.kind ?? 'heart') as DeedReactionKind,
      createdAtMs: tsToMs(data.createdAt ?? null),
    };
  });
}

/** Batch-load lightweight user summaries (name + pic) for the given uids. */
async function loadUserSummaries(uids: string[]): Promise<Map<string, UserInfoRead | null>> {
  const unique = [...new Set(uids.filter(Boolean))];
  const out = new Map<string, UserInfoRead | null>();
  await Promise.all(
    unique.map(async (uid) => {
      try {
        out.set(uid, await fetchUserInfo(uid));
      } catch {
        out.set(uid, null);
      }
    }),
  );
  return out;
}

/**
 * Builds the in-app notification inbox entirely from data the signed-in user is
 * already allowed to read (no cross-user writes, no backend). Covers deed-feed
 * activity on your posts, friends' new posts, incoming friend requests, and acts
 * newly added to your list.
 */
export async function fetchDerivedNotifications(uid: string): Promise<DerivedNotification[]> {
  const now = Date.now();
  const socialFloor = now - SOCIAL_WINDOW_MS;

  const [incomingRequests, myPosts, friends] = await Promise.all([
    fetchIncomingFriendRequests(uid).catch(() => []),
    fetchMyDeedPosts(uid, MY_POSTS_FOR_ACTIVITY).catch(() => []),
    fetchFriends(uid).catch(() => []),
  ]);

  const friendUids = friends.map((f) => f.friendUid);

  const myPostIds = myPosts.map((p) => p.id);
  const myPostCaption = new Map(myPosts.map((p) => [p.id, p.caption] as const));

  const [reactionRowsNested, commentsByPost, friendPosts] = await Promise.all([
    Promise.all(myPostIds.map((id) => fetchReactionsForPost(id).catch(() => []))),
    myPostIds.length > 0 ? fetchCommentsByPostIds(myPostIds).catch(() => ({})) : Promise.resolve({}),
    friendUids.length > 0 ? fetchFriendsDeedPosts(friendUids, 30).catch(() => []) : Promise.resolve([]),
  ]);

  const reactionRows = reactionRowsNested
    .flat()
    .filter((r) => r.reactorUid !== uid && r.createdAtMs >= socialFloor);

  const commentRows = Object.entries(commentsByPost).flatMap(([postId, comments]) =>
    comments
      .filter((c) => c.authorUid !== uid)
      .map((c) => ({ postId, authorUid: c.authorUid, text: c.text, createdAtMs: tsToMs(c.createdAt) }))
      .filter((c) => c.createdAtMs >= socialFloor),
  );

  // Resolve names for reactors / commenters / requesters.
  const lookupUids = [
    ...incomingRequests.map((r) => r.fromUid),
    ...friends
      .filter((f) => f.acceptedByUid && f.acceptedByUid !== uid)
      .map((f) => f.friendUid),
    ...reactionRows.map((r) => r.reactorUid),
    ...commentRows.map((c) => c.authorUid),
  ];
  const summaries = await loadUserSummaries(lookupUids);

  const items: DerivedNotification[] = [];

  for (const req of incomingRequests) {
    const info = summaries.get(req.fromUid) ?? null;
    items.push({
      id: `req:${req.fromUid}`,
      type: 'friend_request',
      title: 'New friend request',
      message: `${displayNameFromInfo(info)} wants to be friends`,
      timestampMs: tsToMs(req.createdAt) || now,
      route: '/(app)/(tabs)/deed-feed/friends',
      actorUid: req.fromUid,
      actorPicUrl: info?.profilePicUrl?.trim() || undefined,
    });
  }

  for (const edge of friends) {
    const accepterUid = edge.acceptedByUid?.trim();
    if (!accepterUid || accepterUid === uid) {
      continue;
    }
    const sinceMs = tsToMs(edge.since);
    if (sinceMs < socialFloor) {
      continue;
    }
    const info = summaries.get(edge.friendUid) ?? null;
    items.push({
      id: `accepted:${edge.friendUid}:${sinceMs}`,
      type: 'friend_request_accepted',
      title: 'Friend request accepted',
      message: `${displayNameFromInfo(info)} accepted your friend request`,
      timestampMs: sinceMs || now,
      route: '/(app)/(tabs)/deed-feed/friends',
      actorUid: edge.friendUid,
      actorPicUrl: info?.profilePicUrl?.trim() || undefined,
    });
  }

  for (const r of reactionRows) {
    const info = summaries.get(r.reactorUid) ?? null;
    const emoji = REACTION_EMOJI[r.kind] ?? '❤️';
    items.push({
      id: `reaction:${r.postId}:${r.reactorUid}`,
      type: 'deed_reaction',
      title: 'New reaction',
      message: `${displayNameFromInfo(info)} reacted ${emoji} to your deed`,
      timestampMs: r.createdAtMs || now,
      route: '/(app)/(tabs)/deed-feed',
      actorUid: r.reactorUid,
      actorPicUrl: info?.profilePicUrl?.trim() || undefined,
      postId: r.postId,
    });
  }

  for (const c of commentRows) {
    const info = summaries.get(c.authorUid) ?? null;
    const snippet = c.text.trim().slice(0, 80);
    items.push({
      id: `comment:${c.postId}:${c.authorUid}:${c.createdAtMs}`,
      type: 'deed_comment',
      title: 'New comment',
      message: `${displayNameFromInfo(info)}: ${snippet}`,
      timestampMs: c.createdAtMs || now,
      route: '/(app)/(tabs)/deed-feed',
      actorUid: c.authorUid,
      actorPicUrl: info?.profilePicUrl?.trim() || undefined,
      postId: c.postId,
    });
  }

  for (const p of friendPosts) {
    const ms = tsToMs(p.createdAt);
    if (ms < now - FRIEND_POST_WINDOW_MS) {
      continue;
    }
    items.push({
      id: `friendpost:${p.id}`,
      type: 'friend_post',
      title: 'New deed from a friend',
      message: `${p.authorDisplayName.trim() || 'A friend'} shared a new deed`,
      timestampMs: ms || now,
      route: '/(app)/(tabs)/deed-feed',
      actorUid: p.authorUid,
      actorPicUrl: p.authorProfilePicUrl?.trim() || undefined,
      postId: p.id,
    });
  }

  items.sort((a, b) => b.timestampMs - a.timestampMs);
  return items;
}

/**
 * Acts newly added to the user's list within the recent window. Kept separate so
 * callers can pass their already-loaded task list (avoids an extra Firestore read).
 */
export function deriveNewTaskNotifications(
  tasks: { id: string; textShort: string; active: boolean; createdAt: Timestamp | null }[] | undefined,
): DerivedNotification[] {
  const now = Date.now();
  const floor = now - NEW_TASK_WINDOW_MS;
  const fresh = (tasks ?? []).filter((t) => t.active && tsToMs(t.createdAt) >= floor);
  if (fresh.length === 0) {
    return [];
  }
  const newestMs = Math.max(...fresh.map((t) => tsToMs(t.createdAt)));
  const count = fresh.length;
  return [
    {
      id: `newtasks:${fresh
        .map((t) => t.id)
        .sort()
        .join('|')}`,
      type: 'new_tasks',
      title: count === 1 ? 'A new act is on your list' : `${count} new acts on your list`,
      message:
        count === 1
          ? fresh[0]!.textShort.trim() || 'Open Tasks to get started.'
          : 'Open Tasks to pick one and earn rewards.',
      timestampMs: newestMs || now,
      route: '/(app)/(tabs)/tasks',
    },
  ];
}
