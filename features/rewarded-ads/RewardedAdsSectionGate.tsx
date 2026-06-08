import { rewardedAdsEnabled } from '@/features/rewarded-ads/rewardedAdConfig';
import type { UserInfoRead } from '@/shared/types/userInfo';

type RewardedAdsSectionGateProps = {
  userInfo: UserInfoRead | undefined;
};

/**
 * Avoids loading the AdMob native module when ads are disabled (1.0.7 store builds).
 */
export function RewardedAdsSectionGate({ userInfo }: RewardedAdsSectionGateProps) {
  if (!rewardedAdsEnabled()) {
    return null;
  }
  const { RewardedAdsSection } = require('@/features/rewarded-ads/RewardedAdsSection') as typeof import('@/features/rewarded-ads/RewardedAdsSection');
  return <RewardedAdsSection userInfo={userInfo} />;
}
