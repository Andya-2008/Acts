import * as Notifications from 'expo-notifications';
import { useRootNavigationState, useRouter } from 'expo-router';
import { useEffect, useRef } from 'react';
import { InteractionManager, Platform } from 'react-native';

import { useFriendsGate } from '@/features/friends/hooks/useFriendsGate';
import {
  hrefForNotificationPayload,
  type NotificationNavPayload,
} from '@/features/notifications/notificationNavigation';
import { markNotificationsSeen } from '@/features/notifications/notificationsSeenStore';
import { useAuthStore } from '@/shared/stores/authStore';

/** Session dedupe — `getLastNotificationResponseAsync` replays the same tap on remount. */
const handledNotificationKeys = new Set<string>();

function payloadFromResponse(
  response: Notifications.NotificationResponse,
): NotificationNavPayload {
  const data = response.notification.request.content.data ?? {};
  return {
    screen: typeof data.screen === 'string' ? data.screen : undefined,
    postId: typeof data.postId === 'string' ? data.postId : undefined,
    type: typeof data.type === 'string' ? data.type : undefined,
    taskId: typeof data.taskId === 'string' ? data.taskId : undefined,
    newUserUid: typeof data.newUserUid === 'string' ? data.newUserUid : undefined,
  };
}

export function notificationResponseKey(response: Notifications.NotificationResponse): string {
  const id = response.notification.request.identifier?.trim();
  if (id) {
    return id;
  }
  const data = response.notification.request.content.data ?? {};
  return `${response.notification.date}:${JSON.stringify(data)}`;
}

function deferNotificationNavigation(run: () => void): void {
  InteractionManager.runAfterInteractions(() => {
    requestAnimationFrame(() => {
      setTimeout(run, 120);
    });
  });
}

/**
 * Opens the relevant screen when the user taps a local or remote notification.
 * Waits for auth + friends gate + root navigation so we do not push routes while
 * the native stack is still mounting (can crash with EXC_BAD_ACCESS on iOS).
 */
export function useNotificationNavigation(): void {
  const router = useRouter();
  const rootState = useRootNavigationState();
  const authReady = useAuthStore((s) => s.authReady);
  const uid = useAuthStore((s) => s.user?.uid);
  const friendsGate = useFriendsGate(uid);
  const pendingResponseRef = useRef<Notifications.NotificationResponse | null>(null);

  const navigationReady =
    Platform.OS !== 'web' &&
    authReady &&
    Boolean(rootState?.key) &&
    (!uid || friendsGate.ready);

  const open = (response: Notifications.NotificationResponse | null) => {
    if (!response || response.actionIdentifier !== Notifications.DEFAULT_ACTION_IDENTIFIER) {
      return;
    }

    const key = notificationResponseKey(response);
    if (handledNotificationKeys.has(key)) {
      return;
    }
    handledNotificationKeys.add(key);

    if (uid) {
      void markNotificationsSeen(uid);
    }

    const href = hrefForNotificationPayload(payloadFromResponse(response));
    deferNotificationNavigation(() => {
      router.push(href);
    });
  };

  useEffect(() => {
    if (!navigationReady) {
      return;
    }

    if (pendingResponseRef.current) {
      const pending = pendingResponseRef.current;
      pendingResponseRef.current = null;
      open(pending);
    }

    const handle = (response: Notifications.NotificationResponse) => {
      if (!navigationReady) {
        pendingResponseRef.current = response;
        return;
      }
      open(response);
    };

    void Notifications.getLastNotificationResponseAsync().then((response) => {
      if (response) {
        handle(response);
      }
    });

    const sub = Notifications.addNotificationResponseReceivedListener(handle);
    return () => sub.remove();
  }, [navigationReady, router, uid]);
}
