import Constants, { ExecutionEnvironment } from 'expo-constants';

/** True when running inside the Expo Go app (not a dev client / store build). */
export function isExpoGoRuntime(): boolean {
  if (Constants.executionEnvironment === ExecutionEnvironment.StoreClient) {
    return true;
  }
  return Constants.appOwnership === 'expo';
}

/** Google OAuth is only supported outside Expo Go. */
export function isGoogleSignInSupportedInRuntime(): boolean {
  return !isExpoGoRuntime();
}
