import { doc, setDoc } from 'firebase/firestore';

import { syncRegisteredContactKeysFromUserInfo } from '@/features/friends/services/registeredContactKeysRepository';
import { firestoreCollections } from '@/shared/config/firestore';
import { getFirebaseFirestore } from '@/shared/services/firebase/client';
import type { UserInfoDoc, UserInfoOnboardingFields } from '@/shared/types/userInfo';

export type OnboardingSubmission = Omit<UserInfoOnboardingFields, never> & Pick<UserInfoDoc, 'First' | 'Last'>;

export async function submitOnboarding(uid: string, data: OnboardingSubmission): Promise<void> {
  const db = getFirebaseFirestore();
  const ref = doc(db, firestoreCollections.userInfo, uid);
  await setDoc(
    ref,
    {
      ...data,
      UserConfig: true,
    },
    { merge: true },
  );
  await syncRegisteredContactKeysFromUserInfo(uid);
}
