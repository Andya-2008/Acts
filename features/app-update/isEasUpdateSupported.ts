import Constants from 'expo-constants';
import * as Updates from 'expo-updates';
import { Platform } from 'react-native';

/** True on release/preview native builds where expo-updates can fetch OTA bundles. */
export function isEasUpdateSupported(): boolean {
  if (Platform.OS === 'web' || __DEV__) {
    return false;
  }
  if (Constants.appOwnership === 'expo') {
    return false;
  }
  return Updates.isEnabled;
}
