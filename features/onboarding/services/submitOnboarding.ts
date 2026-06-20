import { doc, setDoc } from 'firebase/firestore';

import {
  assertPhoneAvailableForUid,
  normalizePhoneKey,
  syncRegisteredContactKeysFromUserInfo,
} from '@/features/friends/services/registeredContactKeysRepository';
import { fetchUserInfo } from '@/features/user-profile/services/userInfoRepository';
import type { QuickPersonalizationParsed } from '@/features/onboarding/validation/quickPersonalizationSchemas';
import { firestoreCollections } from '@/shared/config/firestore';
import { getFirebaseFirestore } from '@/shared/services/firebase/client';
import type { UserInfoDoc, UserInfoOnboardingFields } from '@/shared/types/userInfo';

export type OnboardingSubmission = Omit<UserInfoOnboardingFields, never> & Pick<UserInfoDoc, 'First' | 'Last'>;

const QUICK_DEFAULT_BECOME = 'better-friend';

/** Minimal defaults so skipped users are not prompted on every launch. */
export function buildSkippedPersonalizationPayload(
  profile: Pick<UserInfoDoc, 'First' | 'Last' | 'Phone'> & Partial<UserInfoOnboardingFields>,
): OnboardingSubmission {
  return {
    First: profile.First?.trim() ?? '',
    Last: profile.Last?.trim() ?? '',
    Phone: profile.Phone?.trim() ?? '',
    Hobbies: [],
    Interests: [],
    FavoriteActivities: [],
    Goals: [],
    GrowthGoals: [],
    PersonalityTraits: [],
    TaskDifficulty: profile.TaskDifficulty ?? 'medium',
    HasKids: profile.HasKids ?? false,
    BecomeCategory: profile.BecomeCategory?.trim() || QUICK_DEFAULT_BECOME,
  };
}

/** Two-step flow: up to 3 interests + difficulty; other fields use sensible defaults. */
export function buildQuickPersonalizationPayload(
  profile: Pick<UserInfoDoc, 'First' | 'Last' | 'Phone'>,
  interests: string[],
  interestLabels: string[],
  taskDifficulty: 'easy' | 'medium' | 'hard',
): OnboardingSubmission {
  return {
    First: profile.First?.trim() ?? '',
    Last: profile.Last?.trim() ?? '',
    Phone: profile.Phone?.trim() ?? '',
    Hobbies: [],
    Interests: interestLabels,
    FavoriteActivities: [],
    Goals: ['Kind daily habits'],
    GrowthGoals: [],
    PersonalityTraits: [],
    TaskDifficulty: taskDifficulty,
    HasKids: false,
    BecomeCategory: QUICK_DEFAULT_BECOME,
  };
}

export async function skipPersonalization(uid: string): Promise<void> {
  const existing = await fetchUserInfo(uid);
  if (!existing) {
    throw new Error('Profile not found.');
  }
  await submitOnboarding(uid, buildSkippedPersonalizationPayload(existing));
}

export async function submitQuickPersonalization(
  uid: string,
  data: Pick<QuickPersonalizationParsed, 'interests' | 'taskDifficulty'>,
  interestLabels: string[],
): Promise<void> {
  const existing = await fetchUserInfo(uid);
  if (!existing) {
    throw new Error('Profile not found.');
  }
  await submitOnboarding(
    uid,
    buildQuickPersonalizationPayload(
      existing,
      data.interests,
      interestLabels,
      data.taskDifficulty,
    ),
  );
}

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
