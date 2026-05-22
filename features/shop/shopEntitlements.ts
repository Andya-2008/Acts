import { AUTO_ASSIGN_PER_CADENCE, type AutoAssignPerCadenceCounts } from '@/features/tasks/constants/taskCatalog';

/** Must match `SHOP_ITEMS` id and `firestore.rules` (comment create). */
export const SHOP_ID_DEED_COMMENTS = 'deed_feed_comments_unlock';

export const SHOP_ID_ROSTER_DAILY = 'roster_slot_daily';
export const SHOP_ID_ROSTER_WEEKLY = 'roster_slot_weekly';
export const SHOP_ID_ROSTER_MONTHLY = 'roster_slot_monthly';

const DEFAULT_PER_CADENCE: AutoAssignPerCadenceCounts = {
  daily: AUTO_ASSIGN_PER_CADENCE,
  weekly: AUTO_ASSIGN_PER_CADENCE,
  monthly: AUTO_ASSIGN_PER_CADENCE,
};

/** Extra home-roster picks per cadence from one-time shop unlocks (max +1 each vs default 3). */
export function autoAssignPerCadenceFromPurchases(shopPurchasedIds: string[] | undefined): AutoAssignPerCadenceCounts {
  const s = new Set(shopPurchasedIds ?? []);
  return {
    daily: DEFAULT_PER_CADENCE.daily + (s.has(SHOP_ID_ROSTER_DAILY) ? 1 : 0),
    weekly: DEFAULT_PER_CADENCE.weekly + (s.has(SHOP_ID_ROSTER_WEEKLY) ? 1 : 0),
    monthly: DEFAULT_PER_CADENCE.monthly + (s.has(SHOP_ID_ROSTER_MONTHLY) ? 1 : 0),
  };
}

export function viewerMayPostDeedComments(shopPurchasedIds: string[] | undefined): boolean {
  return new Set(shopPurchasedIds ?? []).has(SHOP_ID_DEED_COMMENTS);
}
