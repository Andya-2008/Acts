import { doc, getDoc, increment, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore';

import { INVITE_FRIEND_REWARD } from '@/features/friends/inviteRewardConfig';
import { notifySystem } from '@/features/notifications/notificationRepository';
import { fetchUserInfo, grantLifetimeXp } from '@/features/user-profile/services/userInfoRepository';
import { firestoreCollections } from '@/shared/config/firestore';
import { getFirebaseFirestore } from '@/shared/services/firebase/client';

function inviteRewardGrantRef(inviterUid: string, friendUid: string) {
  return doc(
    getFirebaseFirestore(),
    firestoreCollections.userInfo,
    inviterUid,
    'inviteRewardsGranted',
    friendUid,
  );
}

async function grantInviteRewardOnce(inviterUid: string, friendUid: string): Promise<boolean> {
  const grantRef = inviteRewardGrantRef(inviterUid, friendUid);
  const existing = await getDoc(grantRef);
  if (existing.exists()) {
    return false;
  }

  const inviterRef = doc(getFirebaseFirestore(), firestoreCollections.userInfo, inviterUid);
  const inviteeRef = doc(getFirebaseFirestore(), firestoreCollections.userInfo, friendUid);

  await setDoc(grantRef, {
    friendUid,
    grantedAt: serverTimestamp(),
    inviterSeeds: INVITE_FRIEND_REWARD.inviterSeeds,
    inviterXp: INVITE_FRIEND_REWARD.inviterXp,
    inviteeSeeds: INVITE_FRIEND_REWARD.inviteeSeeds,
  });

  await updateDoc(inviterRef, {
    HeartPoints: increment(INVITE_FRIEND_REWARD.inviterSeeds),
  });
  await grantLifetimeXp(inviterUid, INVITE_FRIEND_REWARD.inviterXp);
  await updateDoc(inviteeRef, {
    HeartPoints: increment(INVITE_FRIEND_REWARD.inviteeSeeds),
  });

  await notifySystem(
    inviterUid,
    `Your invite paid off! +${INVITE_FRIEND_REWARD.inviterSeeds} seeds and +${INVITE_FRIEND_REWARD.inviterXp} XP.`,
  );

  return true;
}

/**
 * When two users become friends, reward the inviter if the other person signed up via their link.
 */
export async function tryGrantInviteRewardsOnNewFriendship(
  uidA: string,
  uidB: string,
): Promise<void> {
  if (uidA === uidB) {
    return;
  }

  const [profileA, profileB] = await Promise.all([fetchUserInfo(uidA), fetchUserInfo(uidB)]);

  try {
    if (profileB?.InvitedByUid === uidA) {
      await grantInviteRewardOnce(uidA, uidB);
    }
  } catch {
    /* Best-effort; friendship is already saved. */
  }

  try {
    if (profileA?.InvitedByUid === uidB) {
      await grantInviteRewardOnce(uidB, uidA);
    }
  } catch {
    /* Best-effort. */
  }
}
