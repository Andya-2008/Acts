import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { HttpsError, onCall } from 'firebase-functions/v2/https';

function db() {
  return getFirestore();
}

const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 20;

function normalizeUsernameKey(username: string): string {
  return username.trim().toLowerCase();
}

function normalizePhoneKey(phone: string): string | null {
  const digits = phone.replace(/\D/g, '');
  if (digits.length < 10) {
    return null;
  }
  return digits.slice(-10);
}

function phoneKeyDocId(digits10: string): string {
  return `p_${digits10}`;
}

function looksLikeEmailAttempt(raw: string): boolean {
  return raw.trim().includes('@');
}

function clientIp(rawRequest: { ip?: string; headers?: Record<string, string | string[] | undefined> } | undefined): string {
  if (!rawRequest) {
    return 'unknown';
  }
  const forwarded = rawRequest.headers?.['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.length > 0) {
    return forwarded.split(',')[0]?.trim() || 'unknown';
  }
  return rawRequest.ip?.trim() || 'unknown';
}

async function assertRateLimit(ip: string): Promise<void> {
  const ref = db().collection('_rateLimits').doc(`loginResolve_${ip.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 120)}`);
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
    if (count >= MAX_PER_WINDOW) {
      throw new HttpsError('resource-exhausted', 'LOGIN_RATE_LIMIT');
    }
    trx.set(
      ref,
      { windowStart, count: count + 1, updatedAt: FieldValue.serverTimestamp() },
      { merge: true },
    );
  });
}

async function resolveToAuthEmail(identifier: string): Promise<string> {
  const raw = identifier.trim();
  if (!raw) {
    throw new HttpsError('invalid-argument', 'LOGIN_IDENTIFIER_EMPTY');
  }

  if (looksLikeEmailAttempt(raw)) {
    const t = raw.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(t)) {
      throw new HttpsError('invalid-argument', 'LOGIN_INVALID_EMAIL');
    }
    return t;
  }

  const digitsOnly = raw.replace(/\D/g, '');
  if (digitsOnly.length >= 10) {
    const key = normalizePhoneKey(raw);
    if (!key) {
      throw new HttpsError('invalid-argument', 'LOGIN_PHONE_INVALID');
    }
    const snap = await db().collection('phoneLoginLookup').doc(phoneKeyDocId(key)).get();
    if (!snap.exists) {
      throw new HttpsError('not-found', 'LOGIN_PHONE_NOT_FOUND');
    }
    const data = snap.data() as { authEmail?: string } | undefined;
    const email = data?.authEmail?.trim().toLowerCase();
    if (!email || !email.includes('@')) {
      throw new HttpsError('not-found', 'LOGIN_PHONE_NOT_FOUND');
    }
    return email;
  }

  const usernameKey = normalizeUsernameKey(raw.replace(/^@+/, ''));
  if (usernameKey.length < 3) {
    throw new HttpsError('invalid-argument', 'LOGIN_USERNAME_SHORT');
  }

  const snap = await db().collection('usernames').doc(usernameKey).get();
  if (!snap.exists) {
    throw new HttpsError('not-found', 'LOGIN_USERNAME_NOT_FOUND');
  }
  const data = snap.data() as { authEmail?: string } | undefined;
  const email = data?.authEmail?.trim().toLowerCase();
  if (!email || !email.includes('@')) {
    throw new HttpsError('failed-precondition', 'LOGIN_USERNAME_NO_EMAIL');
  }
  return email;
}

/** Resolves email / @username / phone to the Firebase Auth email without public Firestore reads. */
export const resolveLoginIdentifier = onCall(
  { invoker: 'public', maxInstances: 10 },
  async (request) => {
    const identifier = typeof request.data?.identifier === 'string' ? request.data.identifier : '';
    if (identifier.length > 320) {
      throw new HttpsError('invalid-argument', 'LOGIN_IDENTIFIER_EMPTY');
    }

    await assertRateLimit(clientIp(request.rawRequest));
    const authEmail = await resolveToAuthEmail(identifier);
    return { authEmail };
  },
);
