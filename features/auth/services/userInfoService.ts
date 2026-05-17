import type { User } from 'firebase/auth';
import { doc, getDoc, runTransaction, serverTimestamp, updateDoc, type Firestore } from 'firebase/firestore';

import { registerContactKeysForProfile, syncRegisteredContactKeysFromUserInfo } from '@/features/friends/services/registeredContactKeysRepository';
import { firestoreCollections } from '@/shared/config/firestore';
import { getFirebaseFirestore } from '@/shared/services/firebase/client';
import type { UserInfoDoc } from '@/shared/types/userInfo';
import { normalizeUsernameKey } from '@/shared/utils/usernameKey';

async function assertUsernameKeyAvailable(db: Firestore, usernameKey: string): Promise<void> {
  const reserved = await getDoc(doc(db, firestoreCollections.usernames, usernameKey));
  if (reserved.exists()) {
    throw new Error('USERNAME_TAKEN');
  }
}

async function commitUserInfoWithUsernameClaim(
  db: Firestore,
  uid: string,
  usernameKey: string,
  payload: UserInfoDoc,
): Promise<void> {
  const usernameRef = doc(db, firestoreCollections.usernames, usernameKey);
  const userRef = doc(db, firestoreCollections.userInfo, uid);

  await runTransaction(db, async (trx) => {
    const usernameSnap = await trx.get(usernameRef);
    if (usernameSnap.exists()) {
      throw new Error('USERNAME_TAKEN');
    }
    const authEmail = (payload.Email ?? '').trim().toLowerCase();
    if (!authEmail.includes('@') || authEmail.length < 5) {
      throw new Error('PROFILE_EMAIL_REQUIRED_FOR_USERNAME_CLAIM');
    }
    trx.set(usernameRef, { userId: uid, authEmail });
    trx.set(userRef, payload);
  });
}

function splitDisplayName(displayName: string): { first: string; last: string } {
  const trimmed = displayName.trim();
  if (!trimmed) {
    return { first: '', last: '' };
  }
  const parts = trimmed.split(/\s+/);
  if (parts.length === 1) {
    return { first: parts[0]!, last: '' };
  }
  return { first: parts[0]!, last: parts.slice(1).join(' ') };
}

function sanitizeUsernameBase(raw: string): string {
  const cleaned = raw
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, '')
    .slice(0, 20);
  return cleaned.length >= 3 ? cleaned : '';
}

/** Derive a username base from Google profile data (before uniqueness suffixing). */
export function deriveUsernameBaseFromGoogleUser(user: User): string {
  const fromDisplay = user.displayName ? sanitizeUsernameBase(user.displayName.replace(/\s+/g, '_')) : '';
  if (fromDisplay) {
    return fromDisplay;
  }
  const emailLocal = user.email?.split('@')[0] ?? 'user';
  return sanitizeUsernameBase(emailLocal.replace(/\./g, '_')) || `user_${user.uid.slice(0, 8)}`;
}

export async function assertUsernameAvailableForRegistration(username: string): Promise<void> {
  const db = getFirebaseFirestore();
  await assertUsernameKeyAvailable(db, normalizeUsernameKey(username));
}

export async function createUserInfoForEmailPasswordSignup(input: {
  uid: string;
  username: string;
  email: string;
  dobFormatted: string;
  first: string;
  last: string;
  phone: string;
  traits: string[];
  userConfig: boolean;
  profilePicUrl: string | null;
}): Promise<void> {
  const db = getFirebaseFirestore();
  const usernameKey = normalizeUsernameKey(input.username);
  const payload: UserInfoDoc = {
    DOB: input.dobFormatted,
    'Date Joined': serverTimestamp(),
    Email: input.email,
    First: input.first,
    Last: input.last,
    Phone: input.phone,
    Traits: input.traits,
    UserConfig: input.userConfig,
    Username: usernameKey,
    profilePicUrl: input.profilePicUrl,
    HeartPoints: 0,
  };

  await commitUserInfoWithUsernameClaim(db, input.uid, usernameKey, payload);
  try {
    await registerContactKeysForProfile(input.uid, {
      Email: input.email,
      Phone: input.phone,
      Username: usernameKey,
      First: input.first,
      Last: input.last,
    });
  } catch {
    /* Contact-discovery keys are best-effort; profile + username claim are already saved. */
  }
}

export async function ensureUserInfoForGoogleUser(user: User): Promise<void> {
  const db = getFirebaseFirestore();
  const userRef = doc(db, firestoreCollections.userInfo, user.uid);
  const existing = await getDoc(userRef);

  if (existing.exists()) {
    const prev = existing.data() as UserInfoDoc;
    const updates: Partial<UserInfoDoc> = {};
    if (user.email) {
      updates.Email = user.email;
    }
    if (user.photoURL) {
      updates.profilePicUrl = user.photoURL;
    }
    if (Object.keys(updates).length > 0) {
      await updateDoc(userRef, updates);
    }
    const mergedEmail = String(updates.Email ?? prev.Email ?? '')
      .trim()
      .toLowerCase();
    const usernameKey = prev.Username;
    if (mergedEmail.includes('@') && usernameKey) {
      try {
        await updateDoc(doc(db, firestoreCollections.usernames, usernameKey), {
          userId: user.uid,
          authEmail: mergedEmail,
        });
      } catch {
        /* best-effort: older usernames docs may need rules deploy before update succeeds */
      }
    }
    try {
      await syncRegisteredContactKeysFromUserInfo(user.uid);
    } catch {
      /* best-effort: keep keys aligned with profile (email/phone/name) on every sign-in */
    }
    return;
  }

  if (!user.email?.trim()) {
    throw new Error('GOOGLE_EMAIL_REQUIRED');
  }

  const { first, last } = splitDisplayName(user.displayName ?? '');
  const email = user.email.trim();
  const baseKey = deriveUsernameBaseFromGoogleUser(user);

  for (let attempt = 0; attempt < 32; attempt += 1) {
    const usernameKey = attempt === 0 ? baseKey : `${baseKey}${attempt}`;
    if (usernameKey.length < 3) {
      continue;
    }
    try {
      await assertUsernameKeyAvailable(db, usernameKey);
      const payload: UserInfoDoc = {
        DOB: '',
        'Date Joined': serverTimestamp(),
        Email: email,
        First: first,
        Last: last,
        Phone: '',
        Traits: [],
        UserConfig: false,
        Username: usernameKey,
        profilePicUrl: user.photoURL,
        HeartPoints: 0,
      };
      await commitUserInfoWithUsernameClaim(db, user.uid, usernameKey, payload);
      try {
        await registerContactKeysForProfile(user.uid, {
          Email: email,
          Phone: '',
          Username: usernameKey,
          First: first,
          Last: last,
        });
      } catch {
        /* best-effort; do not fail Google sign-up after profile is saved */
      }
      return;
    } catch (error) {
      if (error instanceof Error && error.message === 'USERNAME_TAKEN') {
        continue;
      }
      throw error;
    }
  }

  throw new Error('Could not reserve a unique username for this Google account.');
}
