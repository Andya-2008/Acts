import AsyncStorage from '@react-native-async-storage/async-storage';

const inviteKey = (uid: string) => `@acts/friends_gate_invite_v2_${uid}`;
const contactKey = (uid: string) => `@acts/friends_gate_contact_v2_${uid}`;
const skippedKey = (uid: string) => `@acts/friends_gate_skipped_${uid}`;
const pendingPostSignupKey = (uid: string) => `@acts/friends_gate_pending_post_signup_${uid}`;

/** Call once after email/password signup - not on login or cold app open. */
export async function markPostSignupFriendsGatePending(uid: string): Promise<void> {
  await AsyncStorage.setItem(pendingPostSignupKey(uid), '1');
}

export async function isPostSignupFriendsGatePending(uid: string): Promise<boolean> {
  try {
    return (await AsyncStorage.getItem(pendingPostSignupKey(uid))) === '1';
  } catch {
    return false;
  }
}

export async function clearPostSignupFriendsGatePending(uid: string): Promise<void> {
  try {
    await AsyncStorage.removeItem(pendingPostSignupKey(uid));
  } catch {
    // ignore
  }
}

/** User shared the Acts invite link from the required friends gate screen. */
export async function markFriendsInviteLinkShared(uid: string): Promise<void> {
  await AsyncStorage.setItem(inviteKey(uid), '1');
}

/** User sent a friend request to someone matched from contacts on the gate screen. */
export async function markFriendsContactFriendRequestSent(uid: string): Promise<void> {
  await AsyncStorage.setItem(contactKey(uid), '1');
}

export async function getFriendsInviteLinkShared(uid: string): Promise<boolean> {
  try {
    return (await AsyncStorage.getItem(inviteKey(uid))) === '1';
  } catch {
    return false;
  }
}

export async function getFriendsContactFriendRequestSent(uid: string): Promise<boolean> {
  try {
    return (await AsyncStorage.getItem(contactKey(uid))) === '1';
  } catch {
    return false;
  }
}

/** User skipped the post-signup friends gate (corner dismiss). */
export async function markFriendsGateSkipped(uid: string): Promise<void> {
  await AsyncStorage.setItem(skippedKey(uid), '1');
  await clearPostSignupFriendsGatePending(uid);
}

export async function getFriendsGateSkipped(uid: string): Promise<boolean> {
  try {
    return (await AsyncStorage.getItem(skippedKey(uid))) === '1';
  } catch {
    return false;
  }
}

/**
 * True when the user may enter the main app: has at least one friend, shared an invite link,
 * sent a contact-based friend request, or skipped the gate.
 */
export async function isFriendsGateSatisfied(uid: string, friendCount: number): Promise<boolean> {
  if (friendCount > 0) {
    return true;
  }
  const [invite, contact, skipped] = await Promise.all([
    getFriendsInviteLinkShared(uid),
    getFriendsContactFriendRequestSent(uid),
    getFriendsGateSkipped(uid),
  ]);
  return invite || contact || skipped;
}

/**
 * Post-signup gate only: required when the user just registered and has not completed invite/contacts yet.
 * Returning users who log in are never forced through this screen.
 */
export async function isPostSignupFriendsGateRequired(
  uid: string,
  friendCount: number,
): Promise<boolean> {
  const pending = await isPostSignupFriendsGatePending(uid);
  if (!pending) {
    return false;
  }
  if (friendCount > 0) {
    await clearPostSignupFriendsGatePending(uid);
    return false;
  }
  return true;
}

/**
 * __DEV__ only - clears skip/invite/contact flags and marks gate pending again.
 * Reload the app or open `/(app)/friends-get-started` to test the screen.
 */
export async function resetFriendsGateForDev(uid: string): Promise<void> {
  if (!__DEV__) {
    return;
  }
  await AsyncStorage.multiRemove([
    pendingPostSignupKey(uid),
    skippedKey(uid),
    inviteKey(uid),
    contactKey(uid),
  ]);
  await markPostSignupFriendsGatePending(uid);
}
