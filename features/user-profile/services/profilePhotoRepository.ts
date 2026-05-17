import { updateProfile } from 'firebase/auth';
import { doc, updateDoc } from 'firebase/firestore';

import { firestoreCollections } from '@/shared/config/firestore';
import { getFirebaseAuth, getFirebaseFirestore } from '@/shared/services/firebase/client';
import { uploadUserProfilePhoto } from '@/shared/services/firebase/storageUploads';

/** Uploads to `profile_pictures/{uid}.png`, updates `userInfo.profilePicUrl`, and syncs Auth `photoURL`. */
export async function saveProfilePhotoFromLocalUri(uid: string, localUri: string): Promise<string> {
  const downloadUrl = await uploadUserProfilePhoto(uid, localUri);
  const db = getFirebaseFirestore();
  await updateDoc(doc(db, firestoreCollections.userInfo, uid), { profilePicUrl: downloadUrl });
  const auth = getFirebaseAuth();
  const user = auth.currentUser;
  if (user?.uid === uid) {
    await updateProfile(user, { photoURL: downloadUrl });
  }
  return downloadUrl;
}
