import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
  deleteUser,
  GoogleAuthProvider,
  OAuthProvider,
  signInWithCredential,
  type User,
} from 'firebase/auth';
import * as AppleAuthentication from 'expo-apple-authentication';
import { doc, getDoc, updateDoc } from 'firebase/firestore';

import {
  assertUsernameAvailableForRegistration,
  createUserInfoForEmailPasswordSignup,
  ensureUserInfoForAppleUser,
  ensureUserInfoForGoogleUser,
  type OAuthDisplayNameParts,
} from '@/features/auth/services/userInfoService';
import { createAppleSignInRawNonce, hashAppleSignInNonce } from '@/shared/utils/appleAuthNonce';
import { purgeUserFirebaseData } from '@/features/auth/services/purgeUserFirebaseData';
import { resolveIdentifierToAuthEmail } from '@/features/auth/services/resolveLoginIdentifier';
import { formatDobForUserInfo } from '@/features/auth/utils/formatDob';
import type { SignupFormValues } from '@/features/auth/validation/authSchemas';
import { assertPhoneAvailableForUid, syncRegisteredContactKeysFromUserInfo } from '@/features/friends/services/registeredContactKeysRepository';
import { firestoreCollections } from '@/shared/config/firestore';
import { getFirebaseAuth, getFirebaseFirestore } from '@/shared/services/firebase/client';
import { uploadUserProfilePhoto } from '@/shared/services/firebase/storageUploads';

async function syncLoginLookupDocsAfterEmailPasswordSignIn(uid: string): Promise<void> {
  const db = getFirebaseFirestore();
  try {
    const snap = await getDoc(doc(db, firestoreCollections.userInfo, uid));
    if (!snap.exists()) {
      return;
    }
    const d = snap.data() as { Email?: string; Username?: string };
    const authEmail = String(d.Email ?? '').trim().toLowerCase();
    const usernameKey = String(d.Username ?? '').trim();
    if (authEmail.includes('@') && usernameKey.length > 0) {
      try {
        await updateDoc(doc(db, firestoreCollections.usernames, usernameKey), { userId: uid, authEmail });
      } catch {
        /* older docs or rules */
      }
    }
    await syncRegisteredContactKeysFromUserInfo(uid);
  } catch {
    /* best-effort */
  }
}

export async function signInWithEmail(email: string, password: string): Promise<void> {
  const auth = getFirebaseAuth();
  await signInWithEmailAndPassword(auth, email.trim(), password);
  const u = auth.currentUser;
  if (u) {
    void syncLoginLookupDocsAfterEmailPasswordSignIn(u.uid);
  }
}

export async function signInWithIdentifier(identifier: string, password: string): Promise<void> {
  const email = await resolveIdentifierToAuthEmail(identifier);
  await signInWithEmail(email, password);
}

export async function signInWithGoogleIdToken(idToken: string): Promise<void> {
  const auth = getFirebaseAuth();
  const credential = GoogleAuthProvider.credential(idToken);
  const { user } = await signInWithCredential(auth, credential);
  await ensureUserInfoForGoogleUser(user);
}

export async function signInWithApple(): Promise<void> {
  const rawNonce = createAppleSignInRawNonce();
  const hashedNonce = await hashAppleSignInNonce(rawNonce);

  const appleCredential = await AppleAuthentication.signInAsync({
    requestedScopes: [
      AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
      AppleAuthentication.AppleAuthenticationScope.EMAIL,
    ],
    nonce: hashedNonce,
  });

  if (!appleCredential.identityToken) {
    throw new Error('APPLE_IDENTITY_TOKEN_MISSING');
  }

  const nameParts: OAuthDisplayNameParts | null = appleCredential.fullName
    ? {
        givenName: appleCredential.fullName.givenName,
        familyName: appleCredential.fullName.familyName,
      }
    : null;

  const provider = new OAuthProvider('apple.com');
  const firebaseCredential = provider.credential({
    idToken: appleCredential.identityToken,
    rawNonce,
  });

  const auth = getFirebaseAuth();
  const { user } = await signInWithCredential(auth, firebaseCredential);
  await ensureUserInfoForAppleUser(user, nameParts);
}

export async function sendPasswordReset(email: string): Promise<void> {
  const auth = getFirebaseAuth();
  await sendPasswordResetEmail(auth, email);
}

export async function signOutCurrentUser(): Promise<void> {
  const auth = getFirebaseAuth();
  await signOut(auth);
}

/**
 * Permanently deletes the user's Firestore data, Storage files, lookup docs, deed posts, and social graph,
 * then deletes the Firebase Auth user and signs out.
 */
export async function deleteAccount(): Promise<void> {
  const auth = getFirebaseAuth();
  const user = auth.currentUser;
  if (!user) {
    throw new Error('Not signed in.');
  }
  const uid = user.uid;
  await purgeUserFirebaseData(uid);
  await deleteUser(user);
  await signOut(auth);
}

export async function registerNewUser(input: SignupFormValues): Promise<User> {
  const auth = getFirebaseAuth();
  const db = getFirebaseFirestore();

  const trimmedUser = input.username.trim();

  const credential = await createUserWithEmailAndPassword(auth, input.email, input.password);
  const { user } = credential;

  const resolvedUsername =
    trimmedUser.length >= 3 ? trimmedUser : `user_${user.uid.replace(/-/g, '').slice(0, 15)}`;

  const emailLocal =
    (input.email.trim().split('@')[0] ?? 'friend').replace(/[^a-zA-Z0-9._-]/g, '').slice(0, 24) || 'friend';

  /** If true, Firestore already has `userInfo` + `usernames`; never delete Auth on rollback or we orphan those docs. */
  let firestoreProfileCommitted = false;

  try {
    if (trimmedUser.length > 0) {
      await assertUsernameAvailableForRegistration(trimmedUser);
    }
    const trimmedPhone = input.phone.trim();
    if (trimmedPhone.length > 0) {
      await assertPhoneAvailableForUid(trimmedPhone, user.uid);
    }

    await createUserInfoForEmailPasswordSignup({
      uid: user.uid,
      username: resolvedUsername,
      email: input.email.trim(),
      dobFormatted: input.birthdate ? formatDobForUserInfo(input.birthdate) : '',
      first: '',
      last: '',
      phone: input.phone.trim(),
      traits: [],
      userConfig: false,
      profilePicUrl: null,
    });
    firestoreProfileCommitted = true;

    let profilePicUrl: string | null = null;
    if (input.profilePhotoUri) {
      profilePicUrl = await uploadUserProfilePhoto(user.uid, input.profilePhotoUri);
      const userRef = doc(db, firestoreCollections.userInfo, user.uid);
      await updateDoc(userRef, { profilePicUrl });
    }

    await updateProfile(user, {
      displayName: trimmedUser.length >= 3 ? trimmedUser : emailLocal,
      photoURL: profilePicUrl ?? undefined,
    });

    return user;
  } catch (error) {
    if (!firestoreProfileCommitted) {
      try {
        await deleteUser(user);
      } catch {
        // best-effort rollback; surface original error
      }
    }
    throw error;
  }
}
