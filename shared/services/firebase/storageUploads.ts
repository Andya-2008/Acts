import { deleteObject, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { getFirebaseStorage } from '@/shared/services/firebase/client';

/** Matches existing Storage layout: `profile_pictures/{uid}.png`. */
export async function uploadUserProfilePhoto(uid: string, localUri: string): Promise<string> {
  const storage = getFirebaseStorage();
  const objectRef = ref(storage, `profile_pictures/${uid}.png`);
  const response = await fetch(localUri);
  const blob = await response.blob();
  await uploadBytes(objectRef, blob, { contentType: blob.type || 'image/jpeg' });
  return getDownloadURL(objectRef);
}

/** One image per task doc id under `task_photos/{uid}/{taskId}.jpg`. */
export async function uploadTaskPhoto(uid: string, taskFirestoreDocId: string, localUri: string): Promise<string> {
  const storage = getFirebaseStorage();
  const objectRef = ref(storage, `task_photos/${uid}/${taskFirestoreDocId}.jpg`);
  const response = await fetch(localUri);
  const blob = await response.blob();
  const contentType = blob.type && blob.type.startsWith('image/') ? blob.type : 'image/jpeg';
  await uploadBytes(objectRef, blob, { contentType });
  return getDownloadURL(objectRef);
}

export async function deleteTaskPhotoObject(uid: string, taskFirestoreDocId: string): Promise<void> {
  const storage = getFirebaseStorage();
  const objectRef = ref(storage, `task_photos/${uid}/${taskFirestoreDocId}.jpg`);
  try {
    await deleteObject(objectRef);
  } catch {
    /* object may not exist */
  }
}

/** Deed feed image under `deed_feed_photos/{uid}/{postDocId}.jpg`. `imageUri` may be local or remote. */
export async function uploadDeedFeedPhoto(uid: string, postDocId: string, imageUri: string): Promise<string> {
  const storage = getFirebaseStorage();
  const objectRef = ref(storage, `deed_feed_photos/${uid}/${postDocId}.jpg`);
  const response = await fetch(imageUri);
  const blob = await response.blob();
  const contentType = blob.type && blob.type.startsWith('image/') ? blob.type : 'image/jpeg';
  await uploadBytes(objectRef, blob, { contentType });
  return getDownloadURL(objectRef);
}

/** Honor-system photo for a seasonal challenge log: `season_challenge_photos/{uid}/{fileName}`. */
export async function uploadSeasonChallengePhoto(
  uid: string,
  seasonId: string,
  challengeId: string,
  localUri: string,
): Promise<string> {
  const storage = getFirebaseStorage();
  const safeSeason = seasonId.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 32);
  const safeChallenge = challengeId.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 48);
  const fileName = `${safeSeason}_${safeChallenge}_${Date.now()}.jpg`;
  const objectRef = ref(storage, `season_challenge_photos/${uid}/${fileName}`);
  const response = await fetch(localUri);
  const blob = await response.blob();
  const contentType = blob.type && blob.type.startsWith('image/') ? blob.type : 'image/jpeg';
  await uploadBytes(objectRef, blob, { contentType });
  return getDownloadURL(objectRef);
}

export async function deleteDeedFeedPhotoObject(uid: string, postDocId: string): Promise<void> {
  const storage = getFirebaseStorage();
  const objectRef = ref(storage, `deed_feed_photos/${uid}/${postDocId}.jpg`);
  try {
    await deleteObject(objectRef);
  } catch {
    /* object may not exist */
  }
}
