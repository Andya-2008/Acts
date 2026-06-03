# Leaderboards Implementation Guide

## Overview

Acts now has **three competitive leaderboard systems** to drive engagement:

1. **Weekly Global** — Top 100 players by XP this week
2. **Friends** — Rankings vs your friend group
3. **All-Time** — Lifetime XP achievements

---

## Features

### Weekly Global Leaderboard
- **Updates:** Daily (aggregates stats from current week)
- **Metrics:** XP earned, tasks completed, deeds posted, current streak
- **Incentive:** See your global rank, compete with top players
- **Resets:** Every Monday

### Friends Leaderboard
- **Scope:** Just you vs your friend group
- **Metrics:** Same as weekly (XP this week, streak, etc.)
- **Incentive:** Friendly competition within your circle
- **Updates:** Real-time (every 15 minutes)

### All-Time Leaderboard
- **Scope:** Top 50 players by lifetime XP
- **Metrics:** Total XP accumulated since joining
- **Incentive:** Long-term achievement recognition
- **Updates:** Daily

---

## Data Model

### Leaderboard Entries
```firestore
leaderboardWeekly/{docId}
  userId: "user-123"
  displayName: "Alice"
  avatar: "url/..."
  weekStartDate: timestamp (Monday of week)
  xpThisWeek: 450
  tasksCompletedThisWeek: 8
  deedsPostedThisWeek: 2
  totalXp: 12500
  streak: 5
  createdAt: timestamp
  lastUpdated: timestamp

# Derived from:
userInfo/{userId}
  xp: 12500 (all-time)
  currentStreak: 5
  
userInfo/{userId}/taskCompletions/{taskId}
  completedAt: timestamp
  xpEarned: 50

deedPosts/{postId}
  authorUid: "user-123"
  createdAt: timestamp
```

---

## Backend Setup (Firestore Functions)

Create a Firestore Cloud Function to update leaderboards daily:

```javascript
// functions/updateLeaderboards.js
const functions = require('firebase-functions');
const admin = require('firebase-admin');

exports.updateWeeklyLeaderboard = functions.pubsub
  .schedule('every day 00:00').timeZone('America/Los_Angeles')
  .onRun(async (context) => {
    const db = admin.firestore();
    
    // Get current week boundaries (Monday-Sunday)
    const now = new Date();
    const dayOfWeek = now.getDay();
    const diff = now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
    const weekStart = new Date(now.setDate(diff));
    weekStart.setHours(0, 0, 0, 0);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);

    // Get all users
    const usersRef = db.collection('userInfo');
    const usersSnap = await usersRef.get();

    // Create/update leaderboard entry for each user
    for (const userDoc of usersSnap.docs) {
      const userId = userDoc.id;
      const userData = userDoc.data();

      // Count tasks completed this week
      const tasksSnap = await db.collection('userInfo')
        .doc(userId)
        .collection('taskCompletions')
        .where('completedAt', '>=', admin.firestore.Timestamp.fromDate(weekStart))
        .where('completedAt', '<=', admin.firestore.Timestamp.fromDate(weekEnd))
        .get();

      let xpThisWeek = 0;
      tasksSnap.docs.forEach((task) => {
        xpThisWeek += task.data().xpEarned || 0;
      });

      // Count deeds posted this week
      const deedsSnap = await db.collection('deedPosts')
        .where('authorUid', '==', userId)
        .where('createdAt', '>=', admin.firestore.Timestamp.fromDate(weekStart))
        .where('createdAt', '<=', admin.firestore.Timestamp.fromDate(weekEnd))
        .get();

      // Update or create leaderboard entry
      const leaderboardRef = db.collection('leaderboardWeekly');
      const existing = await leaderboardRef
        .where('userId', '==', userId)
        .where('weekStartDate', '==', admin.firestore.Timestamp.fromDate(weekStart))
        .get();

      const leaderboardData = {
        userId,
        displayName: userData.displayName || 'Anonymous',
        avatar: userData.avatar,
        weekStartDate: admin.firestore.Timestamp.fromDate(weekStart),
        xpThisWeek,
        tasksCompletedThisWeek: tasksSnap.size,
        deedsPostedThisWeek: deedsSnap.size,
        totalXp: userData.xp || 0,
        streak: userData.currentStreak || 0,
        lastUpdated: admin.firestore.Timestamp.now(),
      };

      if (existing.empty) {
        await leaderboardRef.add(leaderboardData);
      } else {
        await existing.docs[0].ref.update(leaderboardData);
      }
    }

    console.log('Updated weekly leaderboards');
    return null;
  });
```

Deploy with:
```bash
firebase deploy --only functions:updateWeeklyLeaderboard
```

---

## Using Leaderboards in Your App

### Display Global Leaderboard

```tsx
import { useGlobalLeaderboardQuery } from '@/features/leaderboards/hooks/useLeaderboardQueries';
import LeaderboardsScreen from '@/app/(app)/(tabs)/leaderboards';

function MyComponent() {
  const { data: leaderboard, isLoading } = useGlobalLeaderboardQuery(100);

  return (
    <FlatList
      data={leaderboard?.entries || []}
      renderItem={({ item }) => (
        <View>
          <Text>#{item.rank} {item.displayName}</Text>
          <Text>+{item.xpThisWeek} XP</Text>
        </View>
      )}
    />
  );
}
```

### Display Friends Leaderboard

```tsx
import { useFriendsLeaderboardQuery } from '@/features/leaderboards/hooks/useLeaderboardQueries';

function FriendsList() {
  const uid = useAuthStore((s) => s.user?.uid);
  const { data: friendsLeaderboard } = useFriendsLeaderboardQuery(uid);

  return (
    <View>
      <Text>Your rank: #{friendsLeaderboard?.userRank?.rank}</Text>
      <FlatList
        data={friendsLeaderboard?.entries || []}
        renderItem={({ item }) => (
          <LeaderboardRow entry={item} />
        )}
      />
    </View>
  );
}
```

### Get User's Current Rank

```tsx
import { useUserGlobalRankQuery } from '@/features/leaderboards/hooks/useLeaderboardQueries';

function UserRankBadge() {
  const uid = useAuthStore((s) => s.user?.uid);
  const { data: rank } = useUserGlobalRankQuery(uid);

  if (!rank) return null;

  return (
    <View>
      <Text>Global Rank: #{rank.rank}</Text>
      <Text>Weekly XP: +{rank.xpThisWeek}</Text>
    </View>
  );
}
```

---

## Integration Points

### When Task is Completed

**File:** `features/tasks/services/taskRepository.ts`

Leaderboard is updated automatically via backend function that runs daily. No code changes needed in task completion.

### When Deed is Posted

Leaderboard automatically includes deed count. Backend function aggregates this daily.

---

## Gamification Elements

### Medals
```
🥇 1st place (Gold)
🥈 2nd place (Silver)
🥉 3rd place (Bronze)
# 4-100 (Rank number)
```

### Status Indicators
- **Streak badge:** 🔥 Shows current daily streak
- **"YOU" badge:** Highlights current user on leaderboards
- **Highlight color:** Current user's row has subtle green background

### Refresh Rates
- **Weekly Global:** Updates once per day (2 AM PT)
- **Friends:** Updates every 15 minutes (real-time feel)
- **All-Time:** Updates daily

---

## Performance Optimization

### Firestore Indexes

Create these indexes for fast queries:

```firestore
# Index 1: Global weekly ranking
Collection: leaderboardWeekly
Fields:
  - weekStartDate (Ascending)
  - xpThisWeek (Descending)

# Index 2: User's rank this week
Collection: leaderboardWeekly
Fields:
  - weekStartDate (Ascending)
  - userId (Ascending)

# Index 3: Friends leaderboard
Collection: userInfo
Subcollection: friends
Fields:
  - weekStartDate (Ascending)
  - xpThisWeek (Descending)
```

### Caching Strategy
- **Weekly global:** Cached 1 hour, refetch every 30 minutes
- **Friends:** Cached 30 minutes, refetch every 15 minutes
- **All-Time:** Cached 1 hour, refetch every 60 minutes
- **User rank:** Cached 30 minutes, refetch every 15 minutes

### Query Limits
- Always limit to top N (100 for global, 50 for all-time)
- Friends leaderboard uses local filtering (no expensive queries)

---

## Analytics Events

Track leaderboard interaction:

```tsx
// User views leaderboard
await trackUI.leaderboardViewed('global' | 'friends' | 'alltime');

// User sees their rank improve
await trackUI.leaderboardRankImproved(oldRank, newRank);

// User achieves medal
await trackUI.leaderboardMedalEarned(medalType, rank);
```

---

## Future Enhancements

1. **Seasonal Leaderboards** — Reset monthly/quarterly
2. **Category Leaderboards** — Best at specific deed types
3. **Team Leaderboards** — Friend group competitions
4. **Achievements for Ranking** — Badges for top 10, 100, etc.
5. **Leaderboard Notifications** — "You're top 10!" alerts
6. **History/Archives** — View past week's leaderboards
7. **Predictions** — "You'll be #X next week if you..."

---

## Testing

### Manual Tests

1. **View Global Leaderboard**
   - Tap "Ranks" tab
   - Select "Weekly"
   - See top 100 players
   - Your entry should be highlighted

2. **View Friends Leaderboard**
   - Tap "Ranks" tab
   - Select "Friends"
   - See only your friends
   - Your rank among friends shown

3. **View All-Time**
   - Tap "Ranks" tab
   - Select "All Time"
   - See top 50 by lifetime XP

4. **Verify Updates**
   - Complete a task
   - Wait 15 minutes
   - Refresh friends leaderboard
   - Your XP should increment

### Automated Tests

```tsx
test('Global leaderboard loads top 100', async () => {
  const data = await getGlobalLeaderboard(100);
  expect(data.entries.length).toBeLessThanOrEqual(100);
  expect(data.entries[0].rank).toBe(1);
});

test('Friends leaderboard includes user and friends', async () => {
  const data = await getFriendsLeaderboard(userId);
  const userEntry = data.entries.find(e => e.userId === userId);
  expect(userEntry).toBeDefined();
});

test('User rank updates after task completion', async () => {
  const rankBefore = await getUserGlobalRank(userId);
  await completeTask(taskId);
  await updateWeeklyLeaderboard(); // Run backend function
  const rankAfter = await getUserGlobalRank(userId);
  expect(rankAfter.xpThisWeek).toBeGreaterThan(rankBefore.xpThisWeek);
});
```

---

## Troubleshooting

**Q: Leaderboard is empty**
A: Wait 24 hours after first users join. Backend function needs to run once to create entries.

**Q: My rank doesn't update**
A: Check that your tasks are being saved with `xpEarned` field. Leaderboard depends on this.

**Q: Friends leaderboard shows everyone**
A: Make sure `friendIds` array is populated in `userInfo/{userId}` when users add friends.

**Q: Slow queries on large datasets**
A: Ensure Firestore indexes are created (check console for slow query warnings).

---

## Resources

- **Leaderboard Repository:** `features/leaderboards/leaderboardRepository.ts`
- **React Hooks:** `features/leaderboards/hooks/useLeaderboardQueries.ts`
- **UI Component:** `app/(app)/(tabs)/leaderboards.tsx`
- **Backend Cloud Function:** `functions/updateLeaderboards.js` (to be created)
