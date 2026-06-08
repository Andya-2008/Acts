import Constants from 'expo-constants';
import { Platform } from 'react-native';

/** Google sample rewarded units — dev fallback when ads are enabled but no production unit is set. */
const TEST_REWARDED_ANDROID = 'ca-app-pub-3940256099942544/5224354917';
const TEST_REWARDED_IOS = 'ca-app-pub-3940256099942544/1712485313';

function stripEnv(v: unknown): string {
  if (typeof v !== 'string') {
    return '';
  }
  return v.trim();
}

function readExtra(key: string): string {
  const extra = Constants.expoConfig?.extra as Record<string, unknown> | undefined;
  return stripEnv(extra?.[key]);
}

/** Off by default. Set EXPO_PUBLIC_REWARDED_ADS_ENABLED=true and rebuild to ship ads. */
export function rewardedAdsEnabled(): boolean {
  const extra = Constants.expoConfig?.extra as Record<string, unknown> | undefined;
  if (extra?.rewardedAdsEnabled === true) {
    return true;
  }
  return stripEnv(process.env.EXPO_PUBLIC_REWARDED_ADS_ENABLED).toLowerCase() === 'true';
}

export function rewardedAdUnitId(): string | null {
  if (!rewardedAdsEnabled()) {
    return null;
  }
  if (Platform.OS === 'android') {
    return stripEnv(process.env.EXPO_PUBLIC_ADMOB_REWARDED_ANDROID) || readExtra('admobRewardedAndroid') || TEST_REWARDED_ANDROID;
  }
  if (Platform.OS === 'ios') {
    return stripEnv(process.env.EXPO_PUBLIC_ADMOB_REWARDED_IOS) || readExtra('admobRewardedIos') || TEST_REWARDED_IOS;
  }
  return null;
}

export function rewardedAdsSupportedOnPlatform(): boolean {
  return rewardedAdsEnabled() && (Platform.OS === 'ios' || Platform.OS === 'android');
}
