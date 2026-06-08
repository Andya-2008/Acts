import { useCallback, useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';
import {
  AdEventType,
  RewardedAd,
  RewardedAdEventType,
  MobileAds,
} from 'react-native-google-mobile-ads';

import {
  applyBonusStreakGraceReward,
  grantRewardedAdReward,
  mapRewardedAdError,
} from '@/features/rewarded-ads/rewardedAdApi';
import { rewardedAdUnitId, rewardedAdsSupportedOnPlatform } from '@/features/rewarded-ads/rewardedAdConfig';
import type { RewardedAdRewardType } from '@/features/rewarded-ads/rewardedAdOffers';

let mobileAdsInit: Promise<void> | null = null;

function ensureMobileAdsInitialized(): Promise<void> {
  if (!rewardedAdsSupportedOnPlatform()) {
    return Promise.resolve();
  }
  if (!mobileAdsInit) {
    mobileAdsInit = MobileAds().initialize().then(() => undefined);
  }
  return mobileAdsInit;
}

export function useRewardedAdPlayer() {
  const adRef = useRef<RewardedAd | null>(null);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!rewardedAdsSupportedOnPlatform()) {
      return;
    }
    void ensureMobileAdsInitialized();
  }, []);

  const loadAd = useCallback(async () => {
    if (!rewardedAdsSupportedOnPlatform()) {
      setError('Rewarded ads are only available on iOS and Android builds.');
      return false;
    }
    const unitId = rewardedAdUnitId();
    if (!unitId) {
      setError('Rewarded ad unit is not configured.');
      return false;
    }

    setError(null);
    setLoading(true);
    setLoaded(false);

    await ensureMobileAdsInitialized();

    return await new Promise<boolean>((resolve) => {
      const rewarded = RewardedAd.createForAdRequest(unitId, {
        requestNonPersonalizedAdsOnly: false,
      });
      adRef.current = rewarded;

      const unsubLoaded = rewarded.addAdEventListener(RewardedAdEventType.LOADED, () => {
        setLoaded(true);
        setLoading(false);
        cleanup();
        resolve(true);
      });
      const unsubFailed = rewarded.addAdEventListener(AdEventType.ERROR, (evt) => {
        setLoading(false);
        setError(evt.message || 'Ad failed to load.');
        cleanup();
        resolve(false);
      });

      const cleanup = () => {
        unsubLoaded();
        unsubFailed();
      };

      rewarded.load();
    });
  }, []);

  const showAdForReward = useCallback(
    async (rewardType: RewardedAdRewardType, themeShopItemId?: string) => {
      if (!rewardedAdsSupportedOnPlatform()) {
        throw new Error('Rewarded ads are only available on iOS and Android builds.');
      }

      setError(null);
      if (!loaded || !adRef.current) {
        const ok = await loadAd();
        if (!ok || !adRef.current) {
          throw new Error(error ?? 'Ad not ready yet.');
        }
      }

      const rewarded = adRef.current!;
      setLoading(true);

      return await new Promise<void>((resolve, reject) => {
        let earned = false;

        const unsubEarned = rewarded.addAdEventListener(RewardedAdEventType.EARNED_REWARD, () => {
          earned = true;
        });
        const unsubClosed = rewarded.addAdEventListener(AdEventType.CLOSED, async () => {
          cleanup();
          setLoading(false);
          setLoaded(false);
          adRef.current = null;

          if (!earned) {
            reject(new Error('Ad closed before the reward was earned.'));
            return;
          }

          try {
            await grantRewardedAdReward(rewardType, themeShopItemId);
            resolve();
          } catch (e) {
            reject(new Error(mapRewardedAdError(e)));
          }
        });
        const unsubFailed = rewarded.addAdEventListener(AdEventType.ERROR, (evt) => {
          cleanup();
          setLoading(false);
          setLoaded(false);
          adRef.current = null;
          reject(new Error(evt.message || 'Ad failed to show.'));
        });

        const cleanup = () => {
          unsubEarned();
          unsubClosed();
          unsubFailed();
        };

        rewarded.show();
      });
    },
    [error, loadAd, loaded],
  );

  return {
    loading,
    loaded,
    error,
    loadAd,
    showAdForReward,
    applyBonusStreakGraceReward,
    mapRewardedAdError,
    supported: rewardedAdsSupportedOnPlatform(),
  };
}
