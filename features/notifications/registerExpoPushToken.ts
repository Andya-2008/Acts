import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { doc, updateDoc } from 'firebase/firestore';

import { getFirebaseFirestore } from '@/shared/services/firebase/client';

/**
 * Saves Expo push token on `userInfo/{uid}` for future friend/social alerts (Cloud Functions).
 * No-op on web or when permission denied.
 */
export async function registerExpoPushToken(uid: string): Promise<void> {
  if (Platform.OS === 'web') {
    return;
  }
  const perm = await Notifications.getPermissionsAsync();
  if (perm.status !== 'granted') {
    return;
  }

  const projectId =
    Constants.expoConfig?.extra?.eas?.projectId ??
    (Constants as { easConfig?: { projectId?: string } }).easConfig?.projectId;
  if (!projectId || typeof projectId !== 'string') {
    return;
  }

  try {
    const token = await Notifications.getExpoPushTokenAsync({ projectId });
    const db = getFirebaseFirestore();
    await updateDoc(doc(db, 'userInfo', uid), {
      ExpoPushToken: token.data,
      ExpoPushTokenUpdatedAt: new Date(),
    });
  } catch {
    // Simulator / missing entitlements — ignore
  }
}
