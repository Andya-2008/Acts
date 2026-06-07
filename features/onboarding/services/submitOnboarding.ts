import { doc, setDoc } from 'firebase/firestore';

import {
  assertPhoneAvailableForUid,
  normalizePhoneKey,
  syncRegisteredContactKeysFromUserInfo,
} from '@/features/friends/services/registeredContactKeysRepository';
import { fetchUserInfo } from '@/features/user-profile/services/userInfoRepository';
import { firestoreCollections } from '@/shared/config/firestore';
import { getFirebaseFirestore } from '@/shared/services/firebase/client';
import type { UserInfoDoc, UserInfoOnboardingFields } from '@/shared/types/userInfo';

export type OnboardingSubmission = Omit<UserInfoOnboardingFields, never> & Pick<UserInfoDoc, 'First' | 'Last'>;

export async function submitOnboarding(uid: string, data: OnboardingSubmission): Promise<void> {
  const db = getFirebaseFirestore();
  const ref = doc(db, firestoreCollections.userInfo, uid);
  const trimmedPhone = data.Phone?.trim() ?? '';
  if (trimmedPhone.length > 0) {
    const existing = await fetchUserInfo(uid);
    const currentNorm = existing?.Phone ? normalizePhoneKey(existing.Phone) : null;
    const nextNorm = normalizePhoneKey(trimmedPhone);
    if (nextNorm && nextNorm !== currentNorm) {
      await assertPhoneAvailableForUid(trimmedPhone, uid);
    }
  }
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
