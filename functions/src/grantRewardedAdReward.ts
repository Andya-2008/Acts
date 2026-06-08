import { getFirestore } from 'firebase-admin/firestore';
import { HttpsError, onCall } from 'firebase-functions/v2/https';

const REWARD_TYPES = ['streak_grace', 'theme_trial', 'weekend_double'] as const;
type RewardType = (typeof REWARD_TYPES)[number];

const SHOP_APPEARANCE: Record<string, string> = {
  appearance_midnight: 'midnight',
  appearance_lavender_mist: 'lavender_mist',
  appearance_desert_sand: 'desert_sand',
  appearance_aurora_night: 'aurora_night',
};

function pad2(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}

function monthKey(d = new Date()): string {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}`;
}

function dayKey(d = new Date()): string {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

function fridayYmdOfWeekendContaining(d: Date): string | null {
  const day = d.getDay();
  if (day !== 0 && day !== 5 && day !== 6) {
    return null;
  }
  const x = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  if (day === 6) {
    x.setDate(x.getDate() - 1);
  } else if (day === 0) {
    x.setDate(x.getDate() - 2);
  }
  return dayKey(x);
}

function endOfMondayAfterWeekendIso(now: Date): string {
  const day = now.getDay();
  const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (day === 5) {
    monday.setDate(monday.getDate() + 3);
  } else if (day === 6) {
    monday.setDate(monday.getDate() + 2);
  } else {
    monday.setDate(monday.getDate() + 1);
  }
  monday.setHours(23, 59, 59, 999);
  return monday.toISOString();
}

function localDateKey(d: Date): string {
  return dayKey(d);
}

function addDaysToKey(key: string, deltaDays: number): string {
  const [y, m, day] = key.split('-').map(Number);
  const dt = new Date(y, m - 1, day);
  dt.setDate(dt.getDate() + deltaDays);
  return dayKey(dt);
}

function streakFromAnchor(days: Set<string>, anchor: string): number {
  let streak = 0;
  for (let cur = anchor; days.has(cur); cur = addDaysToKey(cur, -1)) {
    streak += 1;
  }
  return streak;
}

function canForgiveYesterdayForBonusSave(
  tasks: Array<{ completedAt?: { toDate: () => Date } | null }>,
  grace: Record<string, unknown>,
): { ok: boolean; forgivenDayKey: string | null } {
  const month = monthKey();
  if (grace.streakGraceAdAppliedInMonth === month && grace.streakGraceAdForgivenDayKey) {
    return { ok: false, forgivenDayKey: null };
  }
  const today = localDateKey(new Date());
  const yesterday = addDaysToKey(today, -1);
  const dayBefore = addDaysToKey(today, -2);
  const days = new Set<string>();
  for (const t of tasks) {
    if (t.completedAt == null) {
      continue;
    }
    days.add(localDateKey(t.completedAt.toDate()));
  }
  if (days.has(today) || days.has(yesterday)) {
    return { ok: false, forgivenDayKey: null };
  }
  if (streakFromAnchor(days, dayBefore) < 1) {
    return { ok: false, forgivenDayKey: null };
  }
  return { ok: true, forgivenDayKey: yesterday };
}

function db() {
  return getFirestore();
}

export const grantRewardedAdReward = onCall(
  { invoker: 'public', maxInstances: 10 },
  async (request) => {
    const uid = request.auth?.uid;
    if (!uid) {
      throw new HttpsError('unauthenticated', 'AUTH_REQUIRED');
    }

    const rewardType = request.data?.rewardType as RewardType | undefined;
    if (!rewardType || !REWARD_TYPES.includes(rewardType)) {
      throw new HttpsError('invalid-argument', 'REWARD_TYPE_INVALID');
    }

    const themeShopItemId =
      typeof request.data?.themeShopItemId === 'string' ? request.data.themeShopItemId.trim() : '';

    const ref = db().collection('userInfo').doc(uid);
    const now = new Date();

    await db().runTransaction(async (tx) => {
      const snap = await tx.get(ref);
      if (!snap.exists) {
        throw new HttpsError('not-found', 'PROFILE_NOT_FOUND');
      }
      const data = snap.data() ?? {};
      const settings = (data.ActsSettings ?? {}) as Record<string, unknown>;
      const owned = new Set(Array.isArray(data.ShopPurchasedIds) ? data.ShopPurchasedIds : []);

      if (rewardType === 'streak_grace') {
        const month = monthKey(now);
        if (settings.rewardedAdStreakGraceMonth === month) {
          throw new HttpsError('resource-exhausted', 'REWARD_AD_STREAK_GRACE_MONTHLY');
        }
        const credits = Math.max(0, Math.floor(Number(settings.streakGraceBonusCredits ?? 0)));
        if (credits >= 1) {
          throw new HttpsError('failed-precondition', 'REWARD_STREAK_GRACE_BANK_FULL');
        }
        tx.update(ref, {
          'ActsSettings.streakGraceBonusCredits': 1,
          'ActsSettings.rewardedAdStreakGraceMonth': month,
        });
        return;
      }

      if (rewardType === 'theme_trial') {
        const day = dayKey(now);
        if (settings.rewardedAdThemeTrialDay === day) {
          throw new HttpsError('resource-exhausted', 'REWARD_AD_THEME_TRIAL_DAILY');
        }
        const presetId = SHOP_APPEARANCE[themeShopItemId];
        if (!presetId || owned.has(themeShopItemId)) {
          throw new HttpsError('invalid-argument', 'REWARD_THEME_INVALID');
        }
        const expires = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString();
        tx.update(ref, {
          'ActsSettings.appearanceTrialPresetId': presetId,
          'ActsSettings.appearanceTrialExpiresAt': expires,
          'ActsSettings.appearanceColorPreset': presetId,
          'ActsSettings.rewardedAdThemeTrialDay': day,
        });
        return;
      }

      const fri = fridayYmdOfWeekendContaining(now);
      if (!fri) {
        throw new HttpsError('failed-precondition', 'REWARD_WEEKEND_NOT_ACTIVE');
      }
      const weekendKey = `weekend_double_${fri}`;
      if (settings.rewardedAdWeekendDoubleKey === weekendKey) {
        throw new HttpsError('resource-exhausted', 'REWARD_AD_WEEKEND_ALREADY');
      }
      tx.update(ref, {
        'ActsSettings.weekendDoubleExtendedUntil': endOfMondayAfterWeekendIso(now),
        'ActsSettings.rewardedAdWeekendDoubleKey': weekendKey,
      });
    });

    return { ok: true as const };
  },
);

export const applyBonusStreakGrace = onCall(
  { invoker: 'public', maxInstances: 10 },
  async (request) => {
    const uid = request.auth?.uid;
    if (!uid) {
      throw new HttpsError('unauthenticated', 'AUTH_REQUIRED');
    }

    const ref = db().collection('userInfo').doc(uid);
    const tasksRef = db().collection('userInfo').doc(uid).collection('tasks');

    await db().runTransaction(async (tx) => {
      const snap = await tx.get(ref);
      if (!snap.exists) {
        throw new HttpsError('not-found', 'PROFILE_NOT_FOUND');
      }
      const settings = ((snap.data() ?? {}).ActsSettings ?? {}) as Record<string, unknown>;
      const credits = Math.max(0, Math.floor(Number(settings.streakGraceBonusCredits ?? 0)));
      if (credits < 1) {
        throw new HttpsError('failed-precondition', 'BONUS_STREAK_GRACE_NONE');
      }

      const tasksSnap = await tx.get(tasksRef);
      const tasks = tasksSnap.docs.map((d) => d.data() as { completedAt?: { toDate: () => Date } | null });
      const verdict = canForgiveYesterdayForBonusSave(tasks, settings);
      if (!verdict.ok || !verdict.forgivenDayKey) {
        throw new HttpsError('failed-precondition', 'BONUS_STREAK_GRACE_NOT_NEEDED');
      }

      tx.update(ref, {
        'ActsSettings.streakGraceBonusCredits': credits - 1,
        'ActsSettings.streakGraceAdForgivenDayKey': verdict.forgivenDayKey,
        'ActsSettings.streakGraceAdAppliedInMonth': monthKey(),
      });
    });

    return { ok: true as const };
  },
);
