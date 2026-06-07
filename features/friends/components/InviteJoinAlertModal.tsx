import Ionicons from '@expo/vector-icons/Ionicons';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Image, Modal, Pressable, View } from 'react-native';

import { mapAuthError } from '@/features/auth/utils/mapAuthError';
import { useSendFriendRequestToUidMutation } from '@/features/friends/hooks/useFriendsQueries';
import {
  dismissInviteJoinAlert,
  subscribeInviteJoinAlerts,
  type InviteJoinAlert,
} from '@/features/friends/services/inviteJoinAlertRepository';
import { useUserInfoQuery } from '@/features/user-profile/hooks/useUserInfoQuery';
import { AppButton, AppText } from '@/shared/components/ui';
import { useActAppearance } from '@/shared/providers/ActAppearanceProvider';
import { useAuthStore } from '@/shared/stores/authStore';

function joinerTitle(alert: InviteJoinAlert, profileName: string | undefined): string {
  const fromAlert = alert.joinerDisplayName?.trim();
  if (fromAlert && fromAlert.length > 0) {
    return fromAlert;
  }
  if (profileName && profileName.length > 0) {
    return profileName;
  }
  return 'Your friend';
}

function profileDisplayName(data: { First?: string; Last?: string; Username?: string } | null | undefined): string {
  const full = [data?.First, data?.Last].filter(Boolean).join(' ').trim();
  if (full.length > 0) {
    return full;
  }
  const u = data?.Username?.trim().replace(/^@+/, '');
  return u ? `@${u}` : '';
}

export function InviteJoinAlertModal() {
  const uid = useAuthStore((s) => s.user?.uid);
  const act = useActAppearance();
  const [queue, setQueue] = useState<InviteJoinAlert[]>([]);
  const [current, setCurrent] = useState<InviteJoinAlert | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);
  const dismissedWhileOpenRef = useRef<Set<string>>(new Set());
  const sendMutation = useSendFriendRequestToUidMutation(uid);
  const { data: joinerProfile } = useUserInfoQuery(current?.newUserUid);

  useEffect(() => {
    if (!uid) {
      setQueue([]);
      setCurrent(null);
      return;
    }

    return subscribeInviteJoinAlerts(uid, (alerts) => {
      const filtered = alerts.filter((a) => !dismissedWhileOpenRef.current.has(a.newUserUid));
      setQueue(filtered);
    });
  }, [uid]);

  useEffect(() => {
    if (current || queue.length === 0) {
      return;
    }
    setCurrent(queue[0] ?? null);
    setLocalError(null);
  }, [queue, current]);

  const advance = useCallback(() => {
    setCurrent(null);
    setLocalError(null);
  }, []);

  const onDismiss = useCallback(() => {
    if (!uid || !current) {
      advance();
      return;
    }
    dismissedWhileOpenRef.current.add(current.newUserUid);
    void dismissInviteJoinAlert(uid, current.newUserUid).finally(advance);
  }, [uid, current, advance]);

  const onAddFriend = useCallback(() => {
    if (!uid || !current) {
      return;
    }
    setLocalError(null);
    sendMutation.mutate(current.newUserUid, {
      onSuccess: () => {
        dismissedWhileOpenRef.current.add(current.newUserUid);
        void dismissInviteJoinAlert(uid, current.newUserUid).finally(advance);
      },
      onError: (e) => setLocalError(mapAuthError(e)),
    });
  }, [uid, current, sendMutation, advance]);

  const visible = Boolean(uid && current);
  const title = current ? joinerTitle(current, profileDisplayName(joinerProfile)) : '';
  const avatarUri = joinerProfile?.profilePicUrl?.trim() ?? '';

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onDismiss}>
      <Pressable
        className="flex-1 items-center justify-center bg-black/45 px-6"
        accessibilityRole="button"
        accessibilityLabel="Dismiss invite alert"
        onPress={onDismiss}>
        <Pressable
          className="w-full max-w-sm rounded-3xl border border-acts-border/70 bg-acts-surface px-5 py-6"
          onPress={(e) => e.stopPropagation()}>
          <View className="mb-4 items-center">
            <View
              className="mb-3 h-16 w-16 items-center justify-center overflow-hidden rounded-full border-2"
              style={{ borderColor: `${act.palette.green}66`, backgroundColor: act.palette.greenSoft }}>
              {avatarUri.length > 0 ? (
                <Image source={{ uri: avatarUri }} className="h-full w-full" resizeMode="cover" />
              ) : (
                <Ionicons name="person-add" size={32} color={act.palette.green} />
              )}
            </View>
            <AppText variant="title" className="mb-2 text-center text-acts-ink">
              They joined from your link!
            </AppText>
            <AppText variant="body" className="text-center leading-6 text-acts-muted">
              {title} signed up on Acts. Add them as a friend to see their deeds and earn your invite
              bonus when you connect.
            </AppText>
          </View>

          {localError ? (
            <AppText variant="caption" className="mb-3 text-center text-acts-danger">
              {localError}
            </AppText>
          ) : null}

          <AppButton
            title={sendMutation.isPending ? 'Sending…' : 'Add friend'}
            className="mb-2 w-full"
            disabled={sendMutation.isPending}
            onPress={onAddFriend}
          />
          {sendMutation.isPending ? (
            <ActivityIndicator className="mb-2" color={act.palette.green} />
          ) : null}
          <AppButton title="Not now" variant="secondary" className="w-full" onPress={onDismiss} />
        </Pressable>
      </Pressable>
    </Modal>
  );
}
