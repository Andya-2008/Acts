# Notification Center Implementation Guide

## Overview

A new **Notifications** tab has been added to Acts with:
- **Real-time notification center** (new "Alerts" tab in main navigation)
- **Persistent notifications** stored in Firestore
- **Read/unread status tracking**
- **Notification deletion & clearing**
- **Type-specific icons and colors**

---

## Architecture

### Data Model (Firestore)
```
userInfo/{userId}/notifications/{notificationId}
  ├─ type: 'friend_request' | 'deed_comment' | 'achievement' | ...
  ├─ title: string
  ├─ message: string
  ├─ read: boolean
  ├─ createdAt: timestamp
  ├─ expiresAt?: timestamp (optional)
  ├─ relatedUserId?: string (e.g., who sent friend request)
  ├─ relatedPostId?: string (e.g., which deed)
  ├─ relatedAchievementId?: string
  ├─ relatedChallengeId?: string
  └─ actionUrl?: string (deep link to navigate to)
```

### Services

**`notificationRepository.ts`** — Database operations
- `createNotification()` — Add notification to Firestore
- `getNotifications()` — Fetch notifications (with pagination)
- `markNotificationAsRead()` — Mark single as read
- `deleteNotification()` — Remove notification

**`useNotificationQueries.ts`** — React Query hooks
- `useNotificationsQuery()` — Fetch & cache notifications
- `useUnreadNotificationCountQuery()` — Unread badge count
- `useMarkNotificationAsReadMutation()` — Mark as read
- `useDeleteNotificationMutation()` — Delete notification

### UI Components

**`app/(app)/(tabs)/notifications.tsx`** — Main screen
- Notification list with infinite scroll
- Read/unread indicators
- Delete individual notifications
- Mark all as read button
- Empty state

---

## How to Use in Your Code

### 1. Create a Notification (From Any Screen)

**When user A sends friend request to user B:**

```tsx
import { notifyFriendRequest } from '@/features/notifications/notificationRepository';

// In your friend request logic
await sendFriendRequest(fromUserId, toUserId);
await notifyFriendRequest(toUserId, fromUserId);
```

**When user comments on deed:**

```tsx
import { notifyDeedComment } from '@/features/notifications/notificationRepository';

// In your comment creation logic
await postComment(deedId, commentText);
await notifyDeedComment(deedAuthorId, userName, deedId);
```

### 2. Helper Functions (Ready to Use)

Notifications module includes helpers for common events:

```tsx
// Friend activities
await notifyFriendRequest(toUserId, fromUserId);
await notifyFriendAccepted(toUserId, fromUserId);

// Social engagement
await notifyDeedComment(authorId, commenterName, deedId);
await notifyDeedReaction(authorId, reactorName, deedId, emoji);

// Achievements & challenges
await notifyAchievementUnlocked(userId, achievementName);
await notifyChallengeCompleted(userId, challengeName, xpEarned);

// System messages
await notifySystem(userId, 'Your streak is in danger!');
```

### 3. Display Unread Badge (Optional)

Add this to show notification count in TabBar:

```tsx
import { useUnreadNotificationCountQuery } from '@/features/notifications/hooks/useNotificationQueries';
import { useAuthStore } from '@/shared/stores/authStore';

function NotificationsBadge() {
  const uid = useAuthStore((s) => s.user?.uid);
  const { data: count = 0 } = useUnreadNotificationCountQuery(uid);

  if (count === 0) return null;

  return (
    <View style={{ position: 'absolute', top: -4, right: -4, ... }}>
      <AppText className="text-[10px] font-bold">{count}</AppText>
    </View>
  );
}

// In TabBar, wrap notifications tab with badge
<TabTrigger ...>
  <NotificationsBadge />
  ...
</TabTrigger>
```

---

## Where to Add Notifications

### Task Completion
**File:** `features/tasks/services/taskRepository.ts`

```tsx
import { trackTaskCompleted } from '@/shared/hooks/useAnalyticsTracking';
import { notifyFriends } from '@/features/notifications/notificationRepository';

async function completeTask(taskId: string, userId: string) {
  // ... existing completion logic ...
  
  // Track analytics
  trackTaskCompleted(taskId, difficulty, xpGained);
  
  // Notify friends (optional: let them know you completed a deed)
  if (shareToFeed) {
    await notifyFriendsOfDeed(userId, taskTitle);
  }
}
```

### Deed Post Created
**File:** `features/deed-feed/services/deedPostRepository.ts`

```tsx
import { trackDeedPosted } from '@/shared/hooks/useAnalyticsTracking';

async function createDeedPost(userId: string, deed: DeedPost) {
  // ... create post ...
  
  trackDeedPosted(!!deed.photo, !!deed.caption);
  
  // Optional: Notify friends about your deed
  // await notifyFriendsDeedPosted(userId, deed);
}
```

### Deed Comment
**File:** `features/deed-feed/services/deedCommentRepository.ts`

```tsx
import { notifyDeedComment } from '@/features/notifications/notificationRepository';

async function createComment(deedId: string, userId: string, text: string) {
  const comment = await db.collection('deedPosts').doc(deedId).collection('comments').add({
    text,
    authorUid: userId,
    createdAt: serverTimestamp(),
  });

  // Notify deed author
  const deedAuthor = await getDeedAuthor(deedId);
  const commenter = await getUserInfo(userId);
  
  await notifyDeedComment(deedAuthor.uid, commenter.displayName, deedId);
  
  return comment;
}
```

### Deed Reaction (Like/Emoji)
**File:** `features/deed-feed/services/deedReactionRepository.ts`

```tsx
import { notifyDeedReaction } from '@/features/notifications/notificationRepository';

async function addReaction(deedId: string, userId: string, emoji: string) {
  // ... add reaction ...
  
  // Notify deed author
  const deedAuthor = await getDeedAuthor(deedId);
  const reactor = await getUserInfo(userId);
  
  await notifyDeedReaction(deedAuthor.uid, reactor.displayName, deedId, emoji);
}
```

### Friend Request
**File:** `features/friends/services/friendRepository.ts`

```tsx
import { notifyFriendRequest } from '@/features/notifications/notificationRepository';

async function sendFriendRequest(fromUserId: string, toUserId: string) {
  // ... create friend request ...
  
  await notifyFriendRequest(toUserId, fromUserId);
}
```

### Achievement Unlocked
**File:** `features/achievements/hooks/useAchievementUnlock.ts`

```tsx
import { notifyAchievementUnlocked } from '@/features/notifications/notificationRepository';

function onAchievementUnlocked(userId: string, achievement: Achievement) {
  // ... show overlay ...
  
  await notifyAchievementUnlocked(userId, achievement.name);
  
  // Track analytics
  trackAchievementUnlocked(achievement.id);
}
```

### Challenge Completion
**File:** `features/challenges/services/challengeRepository.ts` (when built)

```tsx
import { notifyChallengeCompleted } from '@/features/notifications/notificationRepository';

async function markChallengeComplete(userId: string, challengeId: string, xpEarned: number) {
  // ... mark complete in Firestore ...
  
  const challenge = await getChallenge(challengeId);
  await notifyChallengeCompleted(userId, challenge.name, xpEarned);
  
  trackChallengeCompleted(challengeId, xpEarned);
}
```

---

## Testing Notifications

### Manual Test

1. **Create a notification manually:**
```tsx
// In any screen component
const { mutate } = useMarkNotificationAsReadMutation(uid);

const handleTestNotif = async () => {
  const notifId = await createNotification(
    userId,
    'deed_comment',
    'Test Comment',
    'This is a test notification'
  );
};
```

2. **Check Firestore:**
   - Go to [Firebase Console → Firestore](https://console.firebase.google.com)
   - Navigate to `userInfo/{yourUserId}/notifications`
   - Verify notification appears there

3. **View in App:**
   - Tap "Alerts" tab
   - You should see your test notification

### Automated Tests

Add to `jest/` later:
```tsx
test('Creating notification adds to Firestore', async () => {
  const notifId = await createNotification(userId, 'system', 'Test', 'Message');
  const notifs = await getNotifications(userId);
  expect(notifs.some(n => n.id === notifId)).toBe(true);
});
```

---

## Best Practices

### ✅ DO

- **Batch notifications** if sending multiple (max 1 per action type per minute)
- **Use specific types** (friend_request, deed_comment, etc.) for filtering
- **Include actionUrl** so users can tap and navigate
- **Set reasonable expiration** for time-sensitive notifications
- **De-duplicate** (don't send same notification twice)

### ❌ DON'T

- Don't create duplicate notifications for same event
- Don't spam notifications (max 1 per user per minute)
- Don't include PII in notifications
- Don't use complex HTML/markdown (plain text only)
- Don't forget to handle notification deletion

---

## Performance Tips

1. **Lazy load notifications** (currently loads 50 at a time)
2. **Use indexes** if you filter by type or date
   - Create Firestore index: `userId + read + createdAt`
3. **Archive old notifications** (e.g., delete read ones after 30 days)
4. **Paginate on scroll** (add load more button when 50+ exist)

---

## Notification Types Reference

| Type | When to Use | Icon | Example |
|------|-------------|------|---------|
| `friend_request` | User sent friend request | people | "Alice sent you a friend request" |
| `friend_accepted` | User accepted friend request | people | "Alice accepted your friend request" |
| `deed_comment` | Comment on user's deed | comment | "Alice commented: 'Nice deed!'" |
| `deed_reaction` | Reaction (emoji) to deed | smiley | "Alice reacted 👍 to your deed" |
| `mention` | Tagged in deed/comment | @symbol | "Alice mentioned you in a deed" |
| `achievement_unlocked` | User achieved milestone | trophy | "You unlocked: Deed Master" |
| `challenge_completed` | Challenge finished | checkmark | "You completed Monthly Challenge" |
| `shop_sale` | Item on sale in shop | cart | "50% off all cosmetics!" |
| `system` | App announcements | info | "Update: New features available" |

---

## Migration Checklist

- [x] Notification data model created (Firestore schema)
- [x] Repository functions written (CRUD ops)
- [x] React Query hooks created (caching, mutations)
- [x] UI components built (Notifications screen)
- [x] Tab navigation integrated ("Alerts" tab added)
- [ ] Helper functions added to all event sources (deed comment, reactions, etc.)
- [ ] Badge count added to TabBar (optional)
- [ ] Deep linking implemented (optional)
- [ ] Firestore rules updated (optional: prevent cross-user access)
- [ ] Analytics events for notifications (optional)
- [ ] Admin dashboard for bulk notifications (optional, for later)

---

## Next Steps

1. **Add deep linking** — Tapping notification should navigate to relevant screen
2. **Implement badge count** — Show unread count in TabBar
3. **Optimize queries** — Add pagination, indexes for large notification lists
4. **Archive old notifications** — Delete read notifications after 30 days
5. **Sound/vibration** — Add haptics when new notification arrives
6. **Push notifications** — Send native push alerts when app is closed (use FCM)
