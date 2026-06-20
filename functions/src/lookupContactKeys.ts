import { FieldValue, getFirestore } from 'firebase-admin/firestore';
import { HttpsError, onCall } from 'firebase-functions/v2/https';

const WINDOW_MS = 60_000;
const MAX_LOOKUPS_PER_WINDOW = 120;
const MAX_KEYS_PER_CALL = 48;

type UserInfoLite = {
  Username?: string;
  First?: string;
  Last?: string;
  ActsSettings?: {
    allowContactDiscovery?: boolean;
    allowFriendRequests?: boolean;
  };
};

export type ContactKeyMatch = {
  keyDocId: string;
  uid: string;
  username: string;
  first: string;
  last: string;
};

function db() {
  return getFirestore();
}

function isValidKeyDocId(id: string): boolean {
  if (typeof id !== 'string') {
    return false;
  }
  if (id.startsWith('e_')) {
    return id.length > 3 && id.length <= 280;
  }
  if (id.startsWith('p_')) {
    return /^p_\d{10}$/.test(id);
  }
  return false;
}

async function assertRateLimit(uid: string): Promise<void> {
  const ref = db().collection('_rateLimits').doc(`contactLookup_${uid}`);
  const now = Date.now();

  await db().runTransaction(async (trx) => {
    const snap = await trx.get(ref);
    const data = snap.data() as { windowStart?: number; count?: number } | undefined;
    const windowStart = typeof data?.windowStart === 'number' ? data.windowStart : now;
    const count = typeof data?.count === 'number' ? data.count : 0;

    if (now - windowStart > WINDOW_MS) {
      trx.set(ref, { windowStart: now, count: 1, updatedAt: FieldValue.serverTimestamp() });
      return;
    }
    if (count >= MAX_LOOKUPS_PER_WINDOW) {
      throw new HttpsError('resource-exhausted', 'CONTACT_LOOKUP_RATE_LIMIT');
    }
    trx.set(
      ref,
      { windowStart, count: count + 1, updatedAt: FieldValue.serverTimestamp() },
      { merge: true },
    );
  });
}

function discoveryAllowed(info: UserInfoLite | undefined): boolean {
  if (!info) {
    return false;
  }
  if (info.ActsSettings?.allowContactDiscovery === false) {
    return false;
  }
  if (info.ActsSettings?.allowFriendRequests === false) {
    return false;
  }
  return true;
}

/**
 * Rate-limited batch lookup for contact matching / friend search by email or phone hash.
 * Clients cannot read `registeredContactKeys` directly (PII hardening).
 */
export const lookupContactKeys = onCall({ invoker: 'public', maxInstances: 10 }, async (request) => {
  if (!request.auth?.uid) {
    throw new HttpsError('unauthenticated', 'CONTACT_LOOKUP_AUTH');
  }
  const callerUid = request.auth.uid;

  const rawIds: unknown[] = Array.isArray(request.data?.keyDocIds) ? request.data.keyDocIds : [];
  if (rawIds.length > MAX_KEYS_PER_CALL) {
    throw new HttpsError('invalid-argument', 'CONTACT_LOOKUP_TOO_MANY_KEYS');
  }

  const keyDocIds: string[] = [
    ...new Set(rawIds.filter((id): id is string => typeof id === 'string' && isValidKeyDocId(id))),
  ];
  if (keyDocIds.length === 0) {
    return { matches: [] as ContactKeyMatch[] };
  }

  await assertRateLimit(callerUid);

  const matches: ContactKeyMatch[] = [];

  await Promise.all(
    keyDocIds.map(async (keyDocId) => {
      const keySnap = await db().collection('registeredContactKeys').doc(keyDocId).get();
      if (!keySnap.exists) {
        return;
      }
      const targetUid = String(keySnap.data()?.uid ?? '').trim();
      if (!targetUid || targetUid === callerUid) {
        return;
      }

      const userSnap = await db().collection('userInfo').doc(targetUid).get();
      const info = userSnap.data() as UserInfoLite | undefined;
      if (!discoveryAllowed(info)) {
        return;
      }

      matches.push({
        keyDocId,
        uid: targetUid,
        username: String(info?.Username ?? '').trim(),
        first: String(info?.First ?? '').trim(),
        last: String(info?.Last ?? '').trim(),
      });
    }),
  );

  return { matches };
});

/** Returns whether a contact key is claimed by someone other than the caller (signup / profile edits). */
export const checkContactKeyTaken = onCall({ invoker: 'public', maxInstances: 10 }, async (request) => {
  if (!request.auth?.uid) {
    throw new HttpsError('unauthenticated', 'CONTACT_KEY_CHECK_AUTH');
  }
  const callerUid = request.auth.uid;
  const keyDocId = typeof request.data?.keyDocId === 'string' ? request.data.keyDocId.trim() : '';
  if (!isValidKeyDocId(keyDocId)) {
    throw new HttpsError('invalid-argument', 'CONTACT_KEY_INVALID');
  }

  const snap = await db().collection('registeredContactKeys').doc(keyDocId).get();
  if (!snap.exists) {
    return { taken: false };
  }
  const owner = String(snap.data()?.uid ?? '').trim();
  return { taken: Boolean(owner && owner !== callerUid) };
});
