import { FirebaseError } from 'firebase/app';
import { httpsCallable } from 'firebase/functions';

import { getFirebaseFunctions } from '@/shared/services/firebase/functionsClient';

function looksLikeEmailAttempt(raw: string): boolean {
  return raw.trim().includes('@');
}

function throwLoginCode(code: string): never {
  throw new Error(code);
}

function mapCallableError(error: unknown): never {
  if (error instanceof FirebaseError) {
    const msg = error.message?.trim();
    if (msg?.startsWith('LOGIN_')) {
      throwLoginCode(msg);
    }
    if (error.code === 'functions/resource-exhausted') {
      throwLoginCode('LOGIN_RATE_LIMIT');
    }
  }
  if (error instanceof Error) {
    const msg = error.message?.trim();
    if (msg?.startsWith('LOGIN_')) {
      throwLoginCode(msg);
    }
  }
  throw error;
}

/**
 * Resolves the login field (email, @username, username, or phone) to the Firebase Auth email address.
 * Email-shaped input is validated locally; username/phone lookups use the `resolveLoginIdentifier` callable.
 */
export async function resolveIdentifierToAuthEmail(identifier: string): Promise<string> {
  const raw = identifier.trim();
  if (!raw) {
    throwLoginCode('LOGIN_IDENTIFIER_EMPTY');
  }

  if (looksLikeEmailAttempt(raw)) {
    const t = raw.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(t)) {
      throwLoginCode('LOGIN_INVALID_EMAIL');
    }
    return t;
  }

  const callable = httpsCallable<{ identifier: string }, { authEmail: string }>(
    getFirebaseFunctions(),
    'resolveLoginIdentifier',
  );

  try {
    const result = await callable({ identifier: raw });
    const email = result.data.authEmail?.trim().toLowerCase();
    if (!email || !email.includes('@')) {
      throwLoginCode('LOGIN_IDENTIFIER_EMPTY');
    }
    return email;
  } catch (e) {
    mapCallableError(e);
  }
}
