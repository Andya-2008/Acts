import { updateProfile } from 'firebase/auth';
import { doc, getDoc, runTransaction, updateDoc } from 'firebase/firestore';

import { usernameSchema } from '@/features/auth/validation/authSchemas';
import { syncRegisteredContactKeysFromUserInfo } from '@/features/friends/services/registeredContactKeysRepository';
import { firestoreCollections } from '@/shared/config/firestore';
import { getFirebaseAuth, getFirebaseFirestore } from '@/shared/services/firebase/client';
import type { UserInfoDoc } from '@/shared/types/userInfo';
import { normalizeUsernameKey } from '@/shared/utils/usernameKey';

import { reauthenticateWithPassword } from './reauthenticateUser';

/** Keeps Firestore `Email`, `usernames.authEmail`, and contact keys aligned with Firebase Auth after verification. */
export async function syncAuthEmailToUserProfileIfNeeded(uid: string, authEmail: string): Promise<void> {
  const email = authEmail.trim().toLowerCase();
  if (!email.includes('@') || email.length < 5) {
    return;
  }

  const db = getFirebaseFirestore();
  const userRef = doc(db, firestoreCollections.userInfo, uid);
  const snap = await getDoc(userRef);
  if (!snap.exists()) {
    return;
  }

  const profile = snap.data() as UserInfoDoc;
  const prevEmail = String(profile.Email ?? '')
    .trim()
    .toLowerCase();
  if (prevEmail === email) {
    return;
  }

  await updateDoc(userRef, { Email: email });

  const usernameKey = String(profile.Username ?? '').trim();
  if (usernameKey.length >= 3) {
    try {
      await updateDoc(doc(db, firestoreCollections.usernames, usernameKey), {
        userId: uid,
        authEmail: email,
      });
    } catch {
      /* best-effort */
    }
  }

  try {
    await syncRegisteredContactKeysFromUserInfo(uid);
  } catch {
    /* best-effort */
  }
}

export async function changeUsernameForUser(
  uid: string,
  newUsernameRaw: string,
  options?: { password?: string; currentEmail?: string },
): Promise<string> {
  const parsed = usernameSchema.safeParse(newUsernameRaw.trim());
  if (!parsed.success) {
    const msg = parsed.error.issues[0]?.message ?? 'Invalid username';
    throw new Error(msg === 'Invalid username' ? 'USERNAME_INVALID' : msg);
  }

  const newKey = normalizeUsernameKey(parsed.data);
  const db = getFirebaseFirestore();
  const userRef = doc(db, firestoreCollections.userInfo, uid);
  const profileSnap = await getDoc(userRef);
  if (!profileSnap.exists()) {
    throw new Error('PROFILE_NOT_FOUND');
  }

  const profile = profileSnap.data() as UserInfoDoc;
  const oldKey = normalizeUsernameKey(profile.Username ?? '');
  if (newKey === oldKey) {
    throw new Error('USERNAME_UNCHANGED');
  }

  const authEmail = String(profile.Email ?? '')
    .trim()
    .toLowerCase();
  if (!authEmail.includes('@') || authEmail.length < 5) {
    throw new Error('PROFILE_EMAIL_REQUIRED_FOR_USERNAME_CLAIM');
  }

  const password = options?.password?.trim();
  const currentEmail = options?.currentEmail?.trim();
  if (password && currentEmail) {
    await reauthenticateWithPassword(currentEmail, password);
  }

  const oldUsernameRef = doc(db, firestoreCollections.usernames, oldKey);
  const newUsernameRef = doc(db, firestoreCollections.usernames, newKey);

  await runTransaction(db, async (trx) => {
    const newSnap = await trx.get(newUsernameRef);
    if (newSnap.exists()) {
      const owner = (newSnap.data() as { userId?: string }).userId;
      if (owner !== uid) {
        throw new Error('USERNAME_TAKEN');
      }
    }

    if (oldKey.length >= 3) {
      const oldSnap = await trx.get(oldUsernameRef);
      if (oldSnap.exists() && (oldSnap.data() as { userId?: string }).userId === uid) {
        trx.delete(oldUsernameRef);
      }
    }

    trx.set(newUsernameRef, { userId: uid, authEmail });
    trx.update(userRef, { Username: newKey });
  });

  try {
    await syncRegisteredContactKeysFromUserInfo(uid);
  } catch {
    /* best-effort */
  }

  const auth = getFirebaseAuth();
  if (auth.currentUser) {
    try {
      await updateProfile(auth.currentUser, { displayName: newKey });
    } catch {
      /* best-effort */
    }
  }

  return newKey;
}
