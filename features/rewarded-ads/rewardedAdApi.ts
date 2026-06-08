import { FirebaseError } from 'firebase/app';
import { httpsCallable } from 'firebase/functions';

import type { RewardedAdRewardType } from '@/features/rewarded-ads/rewardedAdOffers';
import { getFirebaseFunctions } from '@/shared/services/firebase/functionsClient';

export function mapRewardedAdError(error: unknown): string {
  if (error instanceof FirebaseError) {
    const msg = error.message?.trim();
    if (msg) {
      switch (msg) {
        case 'REWARD_AD_STREAK_GRACE_MONTHLY':
          return 'You already claimed a bonus streak save this month.';
        case 'REWARD_STREAK_GRACE_BANK_FULL':
          return 'Use your banked bonus streak save before claiming another.';
        case 'REWARD_AD_THEME_TRIAL_DAILY':
          return 'You already started a backdrop trial today.';
        case 'REWARD_THEME_INVALID':
          return 'Pick a premium backdrop you have not purchased yet.';
        case 'REWARD_WEEKEND_NOT_ACTIVE':
          return 'Weekend double extension is only available Fri–Sun.';
        case 'REWARD_AD_WEEKEND_ALREADY':
          return 'You already extended double rewards this weekend.';
        case 'BONUS_STREAK_GRACE_NONE':
          return 'No bonus streak save available.';
        case 'BONUS_STREAK_GRACE_NOT_NEEDED':
          return 'Your streak does not need a bonus save right now.';
        default:
          break;
      }
    }
  }
  if (error instanceof Error && error.message.trim()) {
    return error.message.trim();
  }
  return 'Could not apply reward. Try again.';
}

export async function grantRewardedAdReward(
  rewardType: RewardedAdRewardType,
  themeShopItemId?: string,
): Promise<void> {
  const callable = httpsCallable<
    { rewardType: RewardedAdRewardType; themeShopItemId?: string },
    { ok: true }
  >(getFirebaseFunctions(), 'grantRewardedAdReward');
  await callable({ rewardType, themeShopItemId });
}

export async function applyBonusStreakGraceReward(): Promise<void> {
  const callable = httpsCallable<Record<string, never>, { ok: true }>(
    getFirebaseFunctions(),
    'applyBonusStreakGrace',
  );
  await callable({});
}
