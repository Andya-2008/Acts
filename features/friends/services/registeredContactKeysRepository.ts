import { deleteDoc, doc, getDoc, runTransaction, type Firestore } from 'firebase/firestore';

import { isContactKeyTakenByOtherUser, lookupContactKeysByDocIds } from '@/features/friends/services/lookupContactKeysService';
import { fetchUserInfo } from '@/features/user-profile/services/userInfoRepository';
import { firestoreCollections } from '@/shared/config/firestore';
import { getFirebaseFirestore } from '@/shared/services/firebase/client';
import { mergeActsDefaults } from '@/shared/types/actsSettings';

/** Minimal contact-key document (PII lives on userInfo; lookups go through Cloud Functions). */
export type RegisteredContactKeyDoc = {
  uid: string;
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

async function deleteKeyIfOwned(db: Firestore, docId: string, uid: string): Promise<void> {
  const ref = keysRef(db, docId);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    return;
  }
  const owner = String((snap.data() as RegisteredContactKeyDoc).uid ?? '').trim();
  if (owner === uid) {
    await deleteDoc(ref);
  }
}

async function removePublishedContactKeys(
  db: Firestore,
  uid: string,
  input: { Email: string; Phone: string },
): Promise<void> {
  const emailNorm = normalizeEmailKey(input.Email);
  if (emailNorm) {
    await deleteKeyIfOwned(db, emailKeyDocId(emailNorm), uid);
  }
  const phoneNorm = input.Phone ? normalizePhoneKey(input.Phone) : null;
  if (phoneNorm) {
    await deleteKeyIfOwned(db, phoneKeyDocId(phoneNorm), uid);
  }
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

  const taken = await isContactKeyTakenByOtherUser(phoneKeyDocId(phoneNorm));
  if (taken) {
    throw new Error('PHONE_TAKEN');
  }
}

async function writeContactKeyIfAvailable(db: Firestore, docId: string, uid: string): Promise<void> {
  const ref = keysRef(db, docId);
  const payload: RegisteredContactKeyDoc = { uid };
  await runTransaction(db, async (trx) => {
    const snap = await trx.get(ref);
    if (!snap.exists()) {
      trx.set(ref, payload);
      return;
    }
    const cur = snap.data() as RegisteredContactKeyDoc;
    if (cur.uid === uid) {
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

/** Publishes email/phone keys so contacts can discover this user (first writer wins per key). */
export async function registerContactKeysForProfile(
  uid: string,
  input: {
    Email: string;
    Phone: string;
    Username: string;
    First?: string;
    Last?: string;
  },
  opts?: { contactDiscoveryEnabled?: boolean },
): Promise<void> {
  const db = getFirebaseFirestore();
  const discoveryEnabled = opts?.contactDiscoveryEnabled !== false;

  if (!discoveryEnabled) {
    await removePublishedContactKeys(db, uid, input);
    return;
  }

  const emailNorm = normalizeEmailKey(input.Email);
  if (emailNorm) {
    await writeContactKeyIfAvailable(db, emailKeyDocId(emailNorm), uid);
  }

  const phoneNorm = input.Phone ? normalizePhoneKey(input.Phone) : null;
  if (phoneNorm) {
    await writeContactKeyIfAvailable(db, phoneKeyDocId(phoneNorm), uid);
  }

  await upsertPhoneLoginLookupForUid(db, uid, input.Email, input.Phone);
}

export async function syncRegisteredContactKeysFromUserInfo(uid: string): Promise<void> {
  const info = await fetchUserInfo(uid);
  if (!info) {
    return;
  }
  const acts = mergeActsDefaults(info.ActsSettings);
  await registerContactKeysForProfile(
    uid,
    {
      Email: info.Email ?? '',
      Phone: info.Phone ?? '',
      Username: info.Username ?? '',
      First: info.First,
      Last: info.Last,
    },
    { contactDiscoveryEnabled: acts.allowContactDiscovery },
  );
}

/** Single-key lookup via rate-limited callable (friend search by email/phone). */
export async function fetchRegisteredUserByKeyDocId(docId: string): Promise<{
  uid: string;
  username: string;
  first: string;
  last: string;
} | null> {
  const matches = await lookupContactKeysByDocIds([docId]);
  const hit = matches.find((m) => m.keyDocId === docId);
  if (!hit) {
    return null;
  }
  return {
    uid: hit.uid,
    username: hit.username,
    first: hit.first,
    last: hit.last,
  };
}
