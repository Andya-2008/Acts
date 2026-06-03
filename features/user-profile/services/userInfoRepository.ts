import { arrayUnion, doc, getDoc, increment, runTransaction, updateDoc } from 'firebase/firestore';

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

/**
 * Applies a signed change to lifetime XP.
 * Positive deltas use `increment` (field created if missing).
 * Negative deltas use a transaction so total XP never drops below 0.
 */
export async function grantLifetimeXp(uid: string, delta: number): Promise<void> {
  const d = Math.floor(delta);
  if (d === 0) {
    return;
  }
  const db = getFirebaseFirestore();
  const ref = doc(db, firestoreCollections.userInfo, uid);

  if (d > 0) {
    await updateDoc(ref, { LifetimeXP: increment(d) });
    return;
  }

  await runTransaction(db, async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists()) {
      return;
    }
    const cur = Math.max(0, Math.floor(Number((snap.data() as UserInfoRead).LifetimeXP ?? 0)));
    tx.update(ref, { LifetimeXP: Math.max(0, cur + d) });
  });
}

export type ShopPurchaseItem = {
  id: string;
  seedCost: number;
  kind:
    | 'taskTheme'
    | 'deedReactionPack'
    | 'appearancePreset'
    | 'extraRosterDaily'
    | 'extraRosterWeekly'
    | 'extraRosterMonthly';
};

/**
 * Atomically spends seeds and records purchase. Caller should sync `useCurrencyStore` with `newHeartPoints`.
 */
export async function purchaseShopItem(uid: string, item: ShopPurchaseItem): Promise<{ newHeartPoints: number }> {
  const db = getFirebaseFirestore();
  const ref = doc(db, firestoreCollections.userInfo, uid);
  const cost = Math.max(0, Math.floor(item.seedCost));

  const out = await runTransaction(db, async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists()) {
      throw new Error('Profile not found.');
    }
    const data = snap.data() as UserInfoRead;
    const hp = Math.max(0, Math.floor(Number(data.HeartPoints ?? 0)));
    const owned = Array.isArray(data.ShopPurchasedIds) ? data.ShopPurchasedIds : [];
    if (owned.includes(item.id)) {
      throw new Error('Already purchased.');
    }
    if (hp < cost) {
      throw new Error('Not enough seeds.');
    }
    const newHp = hp - cost;
    const patch: Record<string, unknown> = {
      HeartPoints: newHp,
      ShopPurchasedIds: arrayUnion(item.id),
    };
    tx.update(ref, patch);
    return { newHp };
  });

  return { newHeartPoints: out.newHp };
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
