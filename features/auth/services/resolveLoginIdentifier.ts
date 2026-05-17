import { doc, getDoc } from 'firebase/firestore';

import {
  normalizePhoneKey,
  phoneKeyDocId,
} from '@/features/friends/services/registeredContactKeysRepository';
import { firestoreCollections } from '@/shared/config/firestore';
import { getFirebaseFirestore } from '@/shared/services/firebase/client';
import { normalizeUsernameKey } from '@/shared/utils/usernameKey';

type UsernameDoc = {
  userId?: string;
  authEmail?: string;
};

type PhoneLoginDoc = {
  uid?: string;
  authEmail?: string;
};

function looksLikeEmailAttempt(raw: string): boolean {
  return raw.trim().includes('@');
}

/**
 * Resolves the login field (email, @username, username, or phone) to the Firebase Auth email address.
 * Requires public `usernames` and `phoneLoginLookup` docs (see `firestore.rules`).
 */
export async function resolveIdentifierToAuthEmail(identifier: string): Promise<string> {
  const raw = identifier.trim();
  if (!raw) {
    throw new Error('LOGIN_IDENTIFIER_EMPTY');
  }

  if (looksLikeEmailAttempt(raw)) {
    const t = raw.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(t)) {
      throw new Error('LOGIN_INVALID_EMAIL');
    }
    return t;
  }

  const digitsOnly = raw.replace(/\D/g, '');
  if (digitsOnly.length >= 10) {
    const db = getFirebaseFirestore();
    const key = normalizePhoneKey(raw);
    if (!key) {
      throw new Error('LOGIN_PHONE_INVALID');
    }
    const snap = await getDoc(doc(db, firestoreCollections.phoneLoginLookup, phoneKeyDocId(key)));
    if (!snap.exists()) {
      throw new Error('LOGIN_PHONE_NOT_FOUND');
    }
    const data = snap.data() as PhoneLoginDoc;
    const email = data.authEmail?.trim().toLowerCase();
    if (!email || !email.includes('@')) {
      throw new Error('LOGIN_PHONE_NOT_FOUND');
    }
    return email;
  }

  const usernameKey = normalizeUsernameKey(raw.replace(/^@+/, ''));
  if (usernameKey.length < 3) {
    throw new Error('LOGIN_USERNAME_SHORT');
  }

  const db = getFirebaseFirestore();
  const snap = await getDoc(doc(db, firestoreCollections.usernames, usernameKey));
  if (!snap.exists()) {
    throw new Error('LOGIN_USERNAME_NOT_FOUND');
  }
  const data = snap.data() as UsernameDoc;
  const email = data.authEmail?.trim().toLowerCase();
  if (!email || !email.includes('@')) {
    throw new Error('LOGIN_USERNAME_NO_EMAIL');
  }
  return email;
}
