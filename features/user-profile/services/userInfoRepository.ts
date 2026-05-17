import { doc, getDoc, updateDoc } from 'firebase/firestore';

import { firestoreCollections } from '@/shared/config/firestore';
import { getFirebaseFirestore } from '@/shared/services/firebase/client';
import type { ActsAppSettings } from '@/shared/types/actsSettings';
import type { UserInfoRead } from '@/shared/types/userInfo';

export async function fetchUserInfo(uid: string): Promise<UserInfoRead | null> {
  const db = getFirebaseFirestore();
  const snap = await getDoc(doc(db, firestoreCollections.userInfo, uid));
  if (!snap.exists()) {
    return null;
  }
  return snap.data() as UserInfoRead;
}

/** Profile picture URLs for feed avatars (parallel reads). */
export async function fetchProfilePicUrlsForUids(uids: string[]): Promise<Record<string, string | null>> {
  const unique = [...new Set(uids.filter(Boolean))];
  const out: Record<string, string | null> = {};
  if (unique.length === 0) {
    return out;
  }
  const db = getFirebaseFirestore();
  await Promise.all(
    unique.map(async (id) => {
      const snap = await getDoc(doc(db, firestoreCollections.userInfo, id));
      if (!snap.exists()) {
        out[id] = null;
        return;
      }
      const raw = (snap.data() as UserInfoRead).profilePicUrl;
      out[id] = typeof raw === 'string' && raw.trim().length > 0 ? raw.trim() : null;
    }),
  );
  return out;
}

export async function updateUserHeartPoints(uid: string, heartPoints: number): Promise<void> {
  const db = getFirebaseFirestore();
  const value = Math.max(0, Math.floor(heartPoints));
  await updateDoc(doc(db, firestoreCollections.userInfo, uid), { HeartPoints: value });
}

export async function mergeActsSettings(uid: string, patch: Partial<ActsAppSettings>): Promise<void> {
  const db = getFirebaseFirestore();
  const updates: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(patch)) {
    if (v === undefined) {
      continue;
    }
    updates[`ActsSettings.${k}`] = v;
  }
  if (Object.keys(updates).length === 0) {
    return;
  }
  await updateDoc(doc(db, firestoreCollections.userInfo, uid), updates);
}

export async function updateUserProfileBasics(
  uid: string,
  fields: { First?: string; Last?: string; Phone?: string; DOB?: string },
): Promise<void> {
  const db = getFirebaseFirestore();
  const ref = doc(db, firestoreCollections.userInfo, uid);
  const updates: Record<string, unknown> = {};
  if (fields.First !== undefined) {
    updates.First = fields.First;
  }
  if (fields.Last !== undefined) {
    updates.Last = fields.Last;
  }
  if (fields.Phone !== undefined) {
    updates.Phone = fields.Phone;
  }
  if (fields.DOB !== undefined) {
    updates.DOB = fields.DOB;
  }
  if (Object.keys(updates).length === 0) {
    return;
  }
  await updateDoc(ref, updates);
}
