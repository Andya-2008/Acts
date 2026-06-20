import { FirebaseError } from 'firebase/app';
import { httpsCallable } from 'firebase/functions';

import { getFirebaseFunctions } from '@/shared/services/firebase/functionsClient';

export type ContactKeyLookupMatch = {
  keyDocId: string;
  uid: string;
  username: string;
  first: string;
  last: string;
};

type LookupContactKeysResponse = {
  matches: ContactKeyLookupMatch[];
};

const BATCH_SIZE = 48;

function mapLookupError(error: unknown): never {
  if (error instanceof FirebaseError) {
    if (error.code === 'functions/unauthenticated') {
      throw new Error('CONTACT_LOOKUP_AUTH');
    }
    if (error.code === 'functions/resource-exhausted') {
      throw new Error('CONTACT_LOOKUP_RATE_LIMIT');
    }
  }
  throw error;
}

/** Server-side batch lookup (replaces direct Firestore reads on `registeredContactKeys`). */
export async function lookupContactKeysByDocIds(keyDocIds: string[]): Promise<ContactKeyLookupMatch[]> {
  if (keyDocIds.length === 0) {
    return [];
  }
  const callable = httpsCallable<{ keyDocIds: string[] }, LookupContactKeysResponse>(
    getFirebaseFunctions(),
    'lookupContactKeys',
  );
  const unique = [...new Set(keyDocIds)];
  const out: ContactKeyLookupMatch[] = [];

  for (let i = 0; i < unique.length; i += BATCH_SIZE) {
    const slice = unique.slice(i, i + BATCH_SIZE);
    try {
      const result = await callable({ keyDocIds: slice });
      out.push(...(result.data.matches ?? []));
    } catch (error) {
      mapLookupError(error);
    }
  }

  return out;
}

/** Whether another Acts account already owns this email/phone key. */
export async function isContactKeyTakenByOtherUser(keyDocId: string): Promise<boolean> {
  const callable = httpsCallable<{ keyDocId: string }, { taken: boolean }>(
    getFirebaseFunctions(),
    'checkContactKeyTaken',
  );
  try {
    const result = await callable({ keyDocId });
    return result.data.taken === true;
  } catch (error) {
    mapLookupError(error);
  }
}
