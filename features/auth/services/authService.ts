import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
  deleteUser,
  GoogleAuthProvider,
  signInWithCredential,
  type User,
} from 'firebase/auth';
import { doc, deleteDoc, getDoc, updateDoc } from 'firebase/firestore';

import {
  assertUsernameAvailableForRegistration,
  createUserInfoForEmailPasswordSignup,
  ensureUserInfoForGoogleUser,
} from '@/features/auth/services/userInfoService';
import { resolveIdentifierToAuthEmail } from '@/features/auth/services/resolveLoginIdentifier';
import { formatDobForUserInfo } from '@/features/auth/utils/formatDob';
import type { SignupFormValues } from '@/features/auth/validation/authSchemas';
import { syncRegisteredContactKeysFromUserInfo } from '@/features/friends/services/registeredContactKeysRepository';
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

export async function sendPasswordReset(email: string): Promise<void> {
  const auth = getFirebaseAuth();
  await sendPasswordResetEmail(auth, email);
}

export async function signOutCurrentUser(): Promise<void> {
  const auth = getFirebaseAuth();
  await signOut(auth);
}

/**
 * Best-effort account teardown for local development: deletes `userInfo/{uid}`, deletes the Auth user, then signs out
 * so client session state clears immediately. Subcollections under `userInfo` and the `usernames` claim may require
 * manual cleanup in Firebase Console.
 */
export async function deleteDeveloperAccount(): Promise<void> {
  const auth = getFirebaseAuth();
  const user = auth.currentUser;
  if (!user) {
    throw new Error('Not signed in.');
  }
  const db = getFirebaseFirestore();
  const uid = user.uid;
  try {
    await deleteDoc(doc(db, firestoreCollections.userInfo, uid));
  } catch {
    /* profile missing or blocked — still attempt Auth deletion */
  }
  await deleteUser(user);
  await signOut(auth);
}

export async function registerNewUser(input: SignupFormValues): Promise<User> {
  const auth = getFirebaseAuth();
  const db = getFirebaseFirestore();

  const trimmedUser = input.username.trim();
  if (trimmedUser.length > 0) {
    await assertUsernameAvailableForRegistration(trimmedUser);
  }

  const credential = await createUserWithEmailAndPassword(auth, input.email, input.password);
  const { user } = credential;

  const resolvedUsername =
    trimmedUser.length >= 3 ? trimmedUser : `user_${user.uid.replace(/-/g, '').slice(0, 15)}`;

  const emailLocal =
    (input.email.trim().split('@')[0] ?? 'friend').replace(/[^a-zA-Z0-9._-]/g, '').slice(0, 24) || 'friend';

  /** If true, Firestore already has `userInfo` + `usernames`; never delete Auth on rollback or we orphan those docs. */
  let firestoreProfileCommitted = false;

  try {
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
