import { create } from 'zustand';

import {
  getNotificationsLastSeenAt,
  setNotificationsLastSeenAt,
} from '@/features/notifications/notificationsLocalState';

/**
 * Shared "inbox last seen" timestamp so the unread badge (deed feed top bar) and
 * the inbox screen stay in sync - reading the inbox clears the badge everywhere.
 */
type NotificationsSeenSlice = {
  uid: string | null;
  lastSeenAt: number;
  hydrate: (uid: string) => Promise<void>;
  markSeen: (uid: string) => Promise<void>;
};

export const useNotificationsSeenStore = create<NotificationsSeenSlice>((set, get) => ({
  uid: null,
  lastSeenAt: 0,
  hydrate: async (uid: string) => {
    if (get().uid === uid) {
      return;
    }
    const ms = await getNotificationsLastSeenAt(uid);
    set({ uid, lastSeenAt: ms });
  },
  markSeen: async (uid: string) => {
    const now = Date.now();
    set({ uid, lastSeenAt: now });
    await setNotificationsLastSeenAt(uid, now);
  },
}));
