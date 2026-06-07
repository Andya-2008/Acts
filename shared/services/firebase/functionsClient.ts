import { getFunctions, type Functions } from 'firebase/functions';

import { getFirebaseApp } from '@/shared/services/firebase/client';

let functionsInstance: Functions | null = null;

/** Cloud Functions (v2) for this project run in `us-central1`. */
export function getFirebaseFunctions(): Functions {
  if (functionsInstance) {
    return functionsInstance;
  }
  functionsInstance = getFunctions(getFirebaseApp(), 'us-central1');
  return functionsInstance;
}

export function resetFirebaseFunctionsForTests(): void {
  functionsInstance = null;
}
