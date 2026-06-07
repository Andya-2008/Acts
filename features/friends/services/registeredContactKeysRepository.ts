import { doc, getDoc, runTransaction, type Firestore } from 'firebase/firestore';

import { normalizeUsernameKey } from '@/shared/utils/usernameKey';
import { fetchUserInfo } from '@/features/user-profile/services/userInfoRepository';
import { firestoreCollections } from '@/shared/config/firestore';
import { getFirebaseFirestore } from '@/shared/services/firebase/client';

export type RegisteredContactKeyDoc = {
  uid: string;
  username: string;
  first: string;
  last: string;
};

function keysRef(db: Firestore, docId: string) {
  return doc(db, firestoreCollections.registeredContactKeys, docId);
}

/** Lowercase email suitable for lookup; rejects obvious junk. */
export function normalizeEmailKey(email: string): string | null {
  const t = email.trim().toLowerCase();
  if (!t.includes('@') || t.length < 5 || t.length > 254) {
    return null;
  }
  return t.replace(/\//g, '_');
}

/** Last 10 digits for matching (US-style); extend later for country codes. */
export function normalizePhoneKey(phone: string): string | null {
  const digits = phone.replace(/\D/g, '');
  if (digits.length < 10) {
    return null;
  }
  return digits.slice(-10);
}

export function emailKeyDocId(normalizedEmail: string): string {
  return `e_${normalizedEmail}`;
}

export function phoneKeyDocId(digits10: string): string {
  return `p_${digits10}`;
}

/** Ensures no other Acts account has claimed this phone for login or contact lookup. */
export async function assertPhoneAvailableForUid(phoneRaw: string, uid: string): Promise<void> {
  const phoneNorm = normalizePhoneKey(phoneRaw);
  if (!phoneNorm) {
    return;
  }
  const db = getFirebaseFirestore();

  const loginSnap = await getDoc(doc(db, firestoreCollections.phoneLoginLookup, phoneKeyDocId(phoneNorm)));
  if (loginSnap.exists()) {
    const owner = String((loginSnap.data() as { uid?: string }).uid ?? '').trim();
    if (owner && owner !== uid) {
      throw new Error('PHONE_TAKEN');
    }
  }

  const contactSnap = await getDoc(keysRef(db, phoneKeyDocId(phoneNorm)));
  if (contactSnap.exists()) {
    const owner = String((contactSnap.data() as RegisteredContactKeyDoc).uid ?? '').trim();
    if (owner && owner !== uid) {
      throw new Error('PHONE_TAKEN');
    }
  }
}

async function writeContactKeyIfAvailable(db: Firestore, docId: string, payload: RegisteredContactKeyDoc): Promise<void> {
  const ref = keysRef(db, docId);
  await runTransaction(db, async (trx) => {
    const snap = await trx.get(ref);
    if (!snap.exists()) {
      trx.set(ref, payload);
      return;
    }
    const cur = snap.data() as RegisteredContactKeyDoc;
    if (cur.uid === payload.uid) {
      trx.set(ref, payload, { merge: true });
    } else if (cur.uid) {
      if (docId.startsWith('p_')) {
        throw new Error('PHONE_TAKEN');
      }
    }
  });
}

async function upsertPhoneLoginLookupForUid(
  db: Firestore,
  uid: string,
  authEmailRaw: string,
  phoneRaw: string,
): Promise<void> {
  const phoneNorm = phoneRaw ? normalizePhoneKey(phoneRaw) : null;
  const authEmail = authEmailRaw.trim().toLowerCase();
  if (!phoneNorm || !authEmail.includes('@') || authEmail.length < 5) {
    return;
  }
  const ref = doc(db, firestoreCollections.phoneLoginLookup, phoneKeyDocId(phoneNorm));
  await runTransaction(db, async (trx) => {
    const snap = await trx.get(ref);
    if (!snap.exists()) {
      trx.set(ref, { uid, authEmail });
      return;
    }
    const cur = snap.data() as { uid?: string };
    if (cur.uid === uid) {
      trx.set(ref, { uid, authEmail }, { merge: true });
    } else if (cur.uid) {
      throw new Error('PHONE_TAKEN');
    }
  });
}

/** Publishes email/phone → profile keys so contacts can discover this user (first writer wins per key). */
export async function registerContactKeysForProfile(
  uid: string,
  input: {
    Email: string;
    Phone: string;
    Username: string;
    First?: string;
    Last?: string;
  },
): Promise<void> {
  const db = getFirebaseFirestore();
  const username = normalizeUsernameKey(input.Username);
  const payload: RegisteredContactKeyDoc = {
    uid,
    username,
    first: String(input.First ?? ''),
    last: String(input.Last ?? ''),
  };

  const emailNorm = normalizeEmailKey(input.Email);
  if (emailNorm) {
    await writeContactKeyIfAvailable(db, emailKeyDocId(emailNorm), payload);
  }

  const phoneNorm = input.Phone ? normalizePhoneKey(input.Phone) : null;
  if (phoneNorm) {
    await writeContactKeyIfAvailable(db, phoneKeyDocId(phoneNorm), payload);
  }

  await upsertPhoneLoginLookupForUid(db, uid, input.Email, input.Phone);
}

export async function syncRegisteredContactKeysFromUserInfo(uid: string): Promise<void> {
  const info = await fetchUserInfo(uid);
  if (!info) {
    return;
  }
  await registerContactKeysForProfile(uid, {
    Email: info.Email ?? '',
    Phone: info.Phone ?? '',
    Username: info.Username ?? '',
    First: info.First,
    Last: info.Last,
  });
}

export async function fetchRegisteredUserByKeyDocId(docId: string): Promise<RegisteredContactKeyDoc | null> {
  const db = getFirebaseFirestore();
  const snap = await getDoc(keysRef(db, docId));
  if (!snap.exists()) {
    return null;
  }
  return snap.data() as RegisteredContactKeyDoc;
}
