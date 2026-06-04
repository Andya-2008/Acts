import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { logger, setGlobalOptions } from 'firebase-functions/v2';
import { onDocumentCreated } from 'firebase-functions/v2/firestore';

import { sendExpoPush, type ExpoPushMessage } from './expoPush';

initializeApp();
const db = getFirestore();

// Cap concurrency so a burst of activity can't run up a surprise bill.
setGlobalOptions({ region: 'us-central1', maxInstances: 10 });

type ActsSettings = Record<string, unknown>;
type UserInfo = {
  First?: string;
  Last?: string;
  Username?: string;
  ExpoPushToken?: string;
  BlockedUids?: string[];
  ActsSettings?: ActsSettings;
};

const REACTION_EMOJI: Record<string, string> = {
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

async function getUserInfo(uid: string): Promise<UserInfo | null> {
  const snap = await db.collection('userInfo').doc(uid).get();
  return snap.exists ? (snap.data() as UserInfo) : null;
}

function displayName(info: UserInfo | null, fallback = 'Someone'): string {
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

/** Notification toggles default to ON when missing (matches the app's parsing). */
function notifyEnabled(info: UserInfo | null, key: string): boolean {
  const v = info?.ActsSettings?.[key];
  return v !== false;
}

/** True when `blocker` has the given uid in their block list. */
function hasBlocked(blocker: UserInfo | null, uid: string): boolean {
  return Array.isArray(blocker?.BlockedUids) && blocker!.BlockedUids!.includes(uid);
}

/**
 * Sends one push to a single recipient after running the shared guards:
 * recipient exists, has a valid token, the relevant setting is on, and they
 * haven't blocked the actor.
 */
async function notifyRecipient(opts: {
  recipientUid: string;
  actorUid: string;
  settingKey: string;
  title: string;
  body: string;
  screen: string;
  postId?: string;
  recipient?: UserInfo | null;
}): Promise<void> {
  const { recipientUid, actorUid, settingKey, title, body, screen, postId } = opts;
  if (recipientUid === actorUid) {
    return;
  }
  const recipient = opts.recipient ?? (await getUserInfo(recipientUid));
  if (!recipient?.ExpoPushToken) {
    return;
  }
  if (!notifyEnabled(recipient, settingKey)) {
    return;
  }
  if (hasBlocked(recipient, actorUid)) {
    return;
  }
  const message: ExpoPushMessage = {
    to: recipient.ExpoPushToken,
    title,
    body,
    data: { screen, ...(postId ? { postId } : {}) },
  };
  await sendExpoPush([message]);
}

/** Someone reacted to your deed. */
export const onDeedReaction = onDocumentCreated(
  'deedPosts/{postId}/reactions/{reactorUid}',
  async (event) => {
    const postId = event.params.postId;
    const reactorUid = event.params.reactorUid;
    const data = event.data?.data() ?? {};
    const kind = String(data.kind ?? 'heart');

    const postSnap = await db.collection('deedPosts').doc(postId).get();
    const authorUid = String(postSnap.data()?.authorUid ?? '');
    if (!authorUid || authorUid === reactorUid) {
      return;
    }

    const actor = await getUserInfo(reactorUid);
    const emoji = REACTION_EMOJI[kind] ?? '❤️';
    await notifyRecipient({
      recipientUid: authorUid,
      actorUid: reactorUid,
      settingKey: 'notifyFriendsReactions',
      title: 'New reaction',
      body: `${displayName(actor)} reacted ${emoji} to your deed`,
      screen: 'deed-feed',
      postId,
    });
  },
);

/** Someone commented on your deed. */
export const onDeedComment = onDocumentCreated(
  'deedPosts/{postId}/comments/{commentId}',
  async (event) => {
    const postId = event.params.postId;
    const data = event.data?.data() ?? {};
    const commenterUid = String(data.authorUid ?? '');
    const text = String(data.text ?? '').trim();

    const postSnap = await db.collection('deedPosts').doc(postId).get();
    const authorUid = String(postSnap.data()?.authorUid ?? '');
    if (!authorUid || !commenterUid || authorUid === commenterUid) {
      return;
    }

    const actor = await getUserInfo(commenterUid);
    const snippet = text.slice(0, 80);
    await notifyRecipient({
      recipientUid: authorUid,
      actorUid: commenterUid,
      // Comments share the reactions toggle (no separate setting in-app today).
      settingKey: 'notifyFriendsReactions',
      title: 'New comment',
      body: snippet ? `${displayName(actor)}: ${snippet}` : `${displayName(actor)} commented on your deed`,
      screen: 'deed-feed',
      postId,
    });
  },
);

/** Someone sent you a friend request. */
export const onFriendRequest = onDocumentCreated(
  'userInfo/{toUid}/friendRequestsIncoming/{fromUid}',
  async (event) => {
    const toUid = event.params.toUid;
    const fromUid = event.params.fromUid;
    if (toUid === fromUid) {
      return;
    }
    const actor = await getUserInfo(fromUid);
    await notifyRecipient({
      recipientUid: toUid,
      actorUid: fromUid,
      settingKey: 'notifyFriendRequests',
      title: 'New friend request',
      body: `${displayName(actor)} wants to be friends`,
      screen: 'notifications',
    });
  },
);

/** A user shared a new deed - notify their friends (respecting each friend's settings). */
export const onDeedPost = onDocumentCreated('deedPosts/{postId}', async (event) => {
  const postId = event.params.postId;
  const data = event.data?.data() ?? {};
  const authorUid = String(data.authorUid ?? '');
  if (!authorUid) {
    return;
  }

  const author = await getUserInfo(authorUid);
  // Don't broadcast posts the author chose to keep private.
  if (author?.ActsSettings?.deedFeedVisibility === 'only_me') {
    return;
  }
  const authorName = displayName(author, 'A friend');

  const friendsSnap = await db.collection('userInfo').doc(authorUid).collection('friends').limit(500).get();
  const friendUids = friendsSnap.docs.map((d) => d.id).filter((id) => id && id !== authorUid);
  if (friendUids.length === 0) {
    return;
  }

  const recipients = await Promise.all(friendUids.map((uid) => getUserInfo(uid).catch(() => null)));

  const messages: ExpoPushMessage[] = [];
  recipients.forEach((recipient, i) => {
    const uid = friendUids[i];
    if (!recipient?.ExpoPushToken) {
      return;
    }
    if (!notifyEnabled(recipient, 'notifyFriendsPosting')) {
      return;
    }
    if (hasBlocked(recipient, authorUid)) {
      return;
    }
    messages.push({
      to: recipient.ExpoPushToken,
      title: 'New deed from a friend',
      body: `${authorName} shared a new deed`,
      data: { screen: 'deed-feed', postId, recipientUid: uid },
    });
  });

  if (messages.length === 0) {
    return;
  }
  logger.info('Sending friend-post pushes', { postId, count: messages.length });
  await sendExpoPush(messages);
});
