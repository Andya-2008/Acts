/**
 * Native autolinking overrides.
 * - expo-firebase-core: deprecated; incompatible with Expo SDK 54+ (ExportedModule removed).
 * - react-native-google-mobile-ads: disabled when rewarded ads are off.
 */
function stripEnv(v) {
  if (typeof v !== 'string') return '';
  return v.trim();
}

const rewardedAdsEnabled =
  stripEnv(process.env.EXPO_PUBLIC_REWARDED_ADS_ENABLED).toLowerCase() === 'true';

const dependencies = {
  'expo-firebase-core': {
    platforms: {
      ios: null,
      android: null,
    },
  },
};

if (!rewardedAdsEnabled) {
  dependencies['react-native-google-mobile-ads'] = {
    platforms: {
      ios: null,
      android: null,
    },
  };
}

module.exports = { dependencies };
