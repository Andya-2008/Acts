import {
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  Timestamp,
  QueryConstraint,
} from 'firebase/firestore';
import { getFirebaseFirestore } from '@/shared/services/firebase/client';

/**
 * Notification types
 */
export type NotificationType =
  | 'friend_request'
  | 'friend_accepted'
  | 'deed_comment'
  | 'deed_reaction'
  | 'mention'
  | 'achievement_unlocked'
  | 'challenge_completed'
  | 'shop_sale'
  | 'system';

export interface ActsNotification {
  id: string;
  userId: string; // who is receiving the notification
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  createdAt: Date;
  expiresAt?: Date; // optional expiration

  // Metadata for different notification types
  relatedUserId?: string; // user who triggered the notification
  relatedPostId?: string; // deed post ID
  relatedAchievementId?: string;
  relatedChallengeId?: string;
  actionUrl?: string; // deep link to follow when tapped
}

/**
 * Create a new notification
 */
export async function createNotification(
  userId: string,
  type: NotificationType,
  title: string,
  message: string,
  metadata?: {
    relatedUserId?: string;
    relatedPostId?: string;
    relatedAchievementId?: string;
    relatedChallengeId?: string;
    actionUrl?: string;
    expiresAt?: Date;
  },
): Promise<string> {
  const db = getFirebaseFirestore();
  const notificationsRef = collection(db, 'userInfo', userId, 'notifications');

  const docRef = await addDoc(notificationsRef, {
    type,
    title,
    message,
    read: false,
    createdAt: Timestamp.now(),
    expiresAt: metadata?.expiresAt ? Timestamp.fromDate(metadata.expiresAt) : null,
    relatedUserId: metadata?.relatedUserId || null,
    relatedPostId: metadata?.relatedPostId || null,
    relatedAchievementId: metadata?.relatedAchievementId || null,
    relatedChallengeId: metadata?.relatedChallengeId || null,
    actionUrl: metadata?.actionUrl || null,
  });

  return docRef.id;
}

/**
 * Get all notifications for a user
 */
export async function getNotifications(
  userId: string,
  options?: {
    unreadOnly?: boolean;
    limit?: number;
  },
): Promise<ActsNotification[]> {
  const db = getFirebaseFirestore();
  const notificationsRef = collection(db, 'userInfo', userId, 'notifications');

  const constraints: QueryConstraint[] = [];

  if (options?.unreadOnly) {
    constraints.push(where('read', '==', false));
  }

  constraints.push(orderBy('createdAt', 'desc'));
  constraints.push(limit(options?.limit || 50));

  const q = query(notificationsRef, ...constraints);
  const snapshot = await getDocs(q);

  return snapshot.docs.map((doc) => ({
    id: doc.id,
    userId,
    ...doc.data(),
    createdAt: doc.data().createdAt?.toDate() || new Date(),
    expiresAt: doc.data().expiresAt?.toDate(),
  } as ActsNotification));
}

/**
 * Get unread notification count
 */
export async function getUnreadNotificationCount(userId: string): Promise<number> {
  const db = getFirebaseFirestore();
  const notificationsRef = collection(db, 'userInfo', userId, 'notifications');

  const q = query(notificationsRef, where('read', '==', false));
  const snapshot = await getDocs(q);

  return snapshot.size;
}

/**
 * Mark notification as read
 */
export async function markNotificationAsRead(userId: string, notificationId: string): Promise<void> {
  const db = getFirebaseFirestore();
  const notificationRef = doc(db, 'userInfo', userId, 'notifications', notificationId);

  await updateDoc(notificationRef, { read: true });
}

/**
 * Mark all notifications as read
 */
export async function markAllNotificationsAsRead(userId: string): Promise<void> {
  const db = getFirebaseFirestore();
  const notifications = await getNotifications(userId, { unreadOnly: true, limit: 1000 });

  for (const notif of notifications) {
    await markNotificationAsRead(userId, notif.id);
  }
}

/**
 * Delete notification
 */
export async function deleteNotification(userId: string, notificationId: string): Promise<void> {
  const db = getFirebaseFirestore();
  const notificationRef = doc(db, 'userInfo', userId, 'notifications', notificationId);

  await deleteDoc(notificationRef);
}

/**
 * Clear all read notifications
 */
export async function clearReadNotifications(userId: string): Promise<void> {
  const db = getFirebaseFirestore();
  const notificationsRef = collection(db, 'userInfo', userId, 'notifications');

  const q = query(notificationsRef, where('read', '==', true));
  const snapshot = await getDocs(q);

  for (const doc of snapshot.docs) {
    await deleteDoc(doc.ref);
  }
}

/**
 * Helper: Create friend request notification
 */
export async function notifyFriendRequest(toUserId: string, fromUserId: string): Promise<string> {
  return createNotification(toUserId, 'friend_request', 'New Friend Request', `Someone wants to be your friend`, {
    relatedUserId: fromUserId,
    actionUrl: `/friends`,
  });
}

/**
 * Helper: Create deed comment notification
 */
export async function notifyDeedComment(
  postAuthorId: string,
  commenterName: string,
  deedPostId: string,
): Promise<string> {
  return createNotification(
    postAuthorId,
    'deed_comment',
    'New Comment',
    `${commenterName} commented on your deed`,
    {
      relatedPostId: deedPostId,
      actionUrl: `/deed-feed?postId=${deedPostId}`,
    },
  );
}

/**
 * Helper: Create deed reaction notification
 */
export async function notifyDeedReaction(
  postAuthorId: string,
  reactorName: string,
  deedPostId: string,
  emoji: string,
): Promise<string> {
  return createNotification(
    postAuthorId,
    'deed_reaction',
    `${emoji} New Reaction`,
    `${reactorName} reacted to your deed`,
    {
      relatedPostId: deedPostId,
      actionUrl: `/deed-feed?postId=${deedPostId}`,
    },
  );
}

/**
 * Helper: Create achievement notification
 */
export async function notifyAchievementUnlocked(userId: string, achievementName: string): Promise<string> {
  return createNotification(
    userId,
    'achievement_unlocked',
    '🏆 Achievement Unlocked',
    `You unlocked: ${achievementName}`,
    { actionUrl: '/achievements' },
  );
}

/**
 * Helper: Create challenge completion notification
 */
export async function notifyChallengeCompleted(userId: string, challengeName: string, xpEarned: number): Promise<string> {
  return createNotification(
    userId,
    'challenge_completed',
    '🎉 Challenge Complete',
    `${challengeName} - Earned +${xpEarned} XP`,
    { actionUrl: '/challenges' },
  );
}

/**
 * Helper: Create system notification
 */
export async function notifySystem(userId: string, message: string): Promise<string> {
  return createNotification(userId, 'system', 'Update', message, {});
}
