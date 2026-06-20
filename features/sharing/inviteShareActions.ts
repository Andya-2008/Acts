import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import { Platform, Share } from 'react-native';

import { getInviteShareMessage, getInviteUrl } from '@/shared/config/appInvite';

export async function copyTextToClipboard(text: string): Promise<void> {
  await Clipboard.setStringAsync(text);
  if (Platform.OS !== 'web') {
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }
}

/** Copies the personal invite URL (with `invitedBy` attribution). */
export async function copyInviteLink(uid: string | undefined): Promise<void> {
  await copyTextToClipboard(getInviteUrl(uid));
}

/** Opens the share sheet. Returns false when the user dismisses without sharing. */
export async function shareInviteLink(uid: string | undefined, title = 'Acts'): Promise<boolean> {
  const result = await Share.share({
    message: getInviteShareMessage(uid),
    title,
    url: Platform.OS === 'ios' ? getInviteUrl(uid) : undefined,
  });
  return result.action !== Share.dismissedAction;
}
