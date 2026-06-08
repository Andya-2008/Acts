import { FirebaseRecaptchaVerifierModal } from 'expo-firebase-recaptcha';
import {
  linkWithPhoneNumber,
  type ConfirmationResult,
  type User,
} from 'firebase/auth';
import { doc, updateDoc } from 'firebase/firestore';

import {
  assertPhoneAvailableForUid,
  normalizePhoneKey,
  syncRegisteredContactKeysFromUserInfo,
} from '@/features/friends/services/registeredContactKeysRepository';
import { fetchUserInfo } from '@/features/user-profile/services/userInfoRepository';
import { firestoreCollections } from '@/shared/config/firestore';
import { getFirebaseAuth, getFirebaseFirestore } from '@/shared/services/firebase/client';
import { e164ToDisplayPhone, toUsE164 } from '@/shared/utils/phoneE164';

export function userHasVerifiedPhone(user: User | null | undefined): boolean {
  return Boolean(user?.phoneNumber?.trim());
}

/** True when the Firestore profile already has a usable phone (pre-1.0.7 accounts). */
export function profileHasSavedPhone(phone: string | null | undefined): boolean {
  return normalizePhoneKey(String(phone ?? '')) !== null;
}

/** SMS verification is required only when Auth has no phone and the profile has none saved. */
export async function userNeedsPhoneVerification(uid: string, user: User | null | undefined): Promise<boolean> {
  if (userHasVerifiedPhone(user)) {
    return false;
  }
  const info = await fetchUserInfo(uid);
  if (profileHasSavedPhone(info?.Phone)) {
    return false;
  }
  return true;
}

export async function reloadAuthUser(): Promise<User | null> {
  const auth = getFirebaseAuth();
  const current = auth.currentUser;
  if (!current) {
    return null;
  }
  await current.reload();
  return auth.currentUser;
}

export async function sendSmsVerificationCode(
  user: User,
  phoneDisplay: string,
  recaptchaVerifier: FirebaseRecaptchaVerifierModal,
): Promise<ConfirmationResult> {
  const e164 = toUsE164(phoneDisplay);
  if (!e164) {
    throw new Error('PHONE_INVALID');
  }
  await assertPhoneAvailableForUid(phoneDisplay, user.uid);
  return linkWithPhoneNumber(user, e164, recaptchaVerifier);
}

export async function confirmSmsVerificationCode(
  confirmation: ConfirmationResult,
  code: string,
): Promise<User> {
  await confirmation.confirm(code.trim());
  const reloaded = await reloadAuthUser();
  if (!reloaded?.phoneNumber) {
    throw new Error('PHONE_VERIFY_FAILED');
  }
  return reloaded;
}

/** Writes the verified phone to Firestore and refreshes contact/login lookup docs. */
export async function syncVerifiedPhoneToUserProfile(uid: string, phoneDisplay: string): Promise<void> {
  const db = getFirebaseFirestore();
  const trimmed = phoneDisplay.trim();
  await updateDoc(doc(db, firestoreCollections.userInfo, uid), { Phone: trimmed });
  await syncRegisteredContactKeysFromUserInfo(uid);
}

export function verifiedPhoneDisplay(user: User): string {
  if (!user.phoneNumber) {
    return '';
  }
  return e164ToDisplayPhone(user.phoneNumber);
}
