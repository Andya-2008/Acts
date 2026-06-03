import { Platform } from 'react-native';

/** App Store Guideline 4.8: Sign in with Apple is required on iOS when offering other OAuth providers. */
export function shouldShowAppleAuthOnAuthScreens(): boolean {
  return Platform.OS === 'ios';
}
