import { FieldValue, getFirestore } from 'firebase-admin/firestore';
import { logger } from 'firebase-functions/v2';
import { onDocumentCreated } from 'firebase-functions/v2/firestore';

import { sendExpoPush, type ExpoPushMessage } from './expoPush';

function db() {
  return getFirestore();
}

type ActsSettings = Record<string, unknown>;
type UserInfo = {
  First?: string;
  Last?: string;
  Username?: string;
  ExpoPushToken?: string;
  BlockedUids?: string[];
  ActsSettings?: ActsSettings;
  InvitedByUid?: string;
};

async function getUserInfo(uid: string): Promise<UserInfo | null> {
  const snap = await db().collection('userInfo').doc(uid).get();
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

function notifyEnabled(info: UserInfo | null, key: string): boolean {
  const v = info?.ActsSettings?.[key];
  return v !== false;
}

function hasBlocked(blocker: UserInfo | null, uid: string): boolean {
  return Array.isArray(blocker?.BlockedUids) && blocker!.BlockedUids!.includes(uid);
}

/** When a referred user creates their profile, alert the inviter in-app and via push. */
export const onInviteSignup = onDocumentCreated('userInfo/{userId}', async (event) => {
  const newUserId = event.params.userId;
  const data = (event.data?.data() ?? {}) as UserInfo;
  const inviterUid = String(data.InvitedByUid ?? '').trim();

  if (!inviterUid || inviterUid === newUserId) {
    return;
  }

  const inviter = await getUserInfo(inviterUid);
  if (!inviter) {
    logger.warn('Invite signup: inviter profile missing', { inviterUid, newUserId });
    return;
  }

  if (hasBlocked(inviter, newUserId)) {
    return;
  }

  const joinerName = displayName(data, 'A friend');

  await db()
    .collection('userInfo')
    .doc(inviterUid)
    .collection('inviteJoinAlerts')
    .doc(newUserId)
    .set({
      newUserUid: newUserId,
      joinerDisplayName: joinerName,
      createdAt: FieldValue.serverTimestamp(),
    });

  if (!inviter.ExpoPushToken || !notifyEnabled(inviter, 'notifyFriendRequests')) {
    return;
  }

  const message: ExpoPushMessage = {
    to: inviter.ExpoPushToken,
    title: 'Your friend joined Acts!',
    body: `${joinerName} signed up from your invite. Add them as a friend.`,
    data: {
      screen: 'friends',
      type: 'invite_join',
      newUserUid: newUserId,
    },
  };

  await sendExpoPush([message]);
});
