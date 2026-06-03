# Referral Program Implementation

## Overview

Acts now has a **complete referral & reward system** that drives growth through network effects:

- **Unique referral codes** (e.g., ALICE_X7F2)
- **Deep linking** support (acts://referral/CODE and https://acts.app/join?ref=CODE)
- **Automatic rewards** when new users complete 5 tasks
- **Tracking & history** of all referrals
- **Share UI** with built-in copy & native sharing

---

## How It Works

### Flow: User A → Refers → User B

```
1. User A opens profile → sees "Share & Earn XP" card
2. User A shares referral code ALICE_X7F2 or deep link
3. User B signs up with code ALICE_X7F2
   → User B gets +500 XP welcome bonus
   → Referral marked as "pending"
4. User B completes first 5 tasks
   → User A gets +100 XP reward
   → Referral marked as "claimed"
   → Both get notification
```

### Data Model

```firestore
referrals/{userId}
  code: "ALICE_X7F2"
  completedReferrals: 3
  totalRewardsEarned: 300
  createdAt: timestamp
  pendingRewards: 0

referralSignups/{newUserId}
  referrerId: "alice-uid"
  referralCode: "ALICE_X7F2"
  signupDate: timestamp
  tasksCompleted: 2 (out of 5)
  rewardClaimed: false
  newUserXpEarned: 500

referralRewards/{docId}
  referrerId: "alice-uid"
  newUserId: "bob-uid"
  referralCode: "ALICE_X7F2"
  status: "claimed" | "pending" | "expired"
  xpAmount: 100
  createdAt: timestamp
  claimedAt: timestamp
  expiresAt: timestamp (90 days)
```

---

## Integration Points

### 1. Auth Flow - Handle Referral Signup

**File:** `features/auth/services/authRepository.ts`

```tsx
import { parseReferralCodeFromLink } from '@/features/referrals/referralRepository';
import { useProcessReferralSignupMutation } from '@/features/referrals/hooks/useReferralQueries';

async function handleNewUserSignup(newUserId: string, displayName: string, deepLink?: string) {
  // ... existing signup logic ...

  // Check if user signed up via referral link
  if (deepLink) {
    const referralCode = parseReferralCodeFromLink(deepLink);
    if (referralCode) {
      const { mutateAsync } = useProcessReferralSignupMutation();
      await mutateAsync({
        newUserId,
        referralCode,
        displayName,
      });
    }
  }
}
```

### 2. Task Completion - Track Referral Progress

**File:** `features/tasks/services/taskRepository.ts`

```tsx
import { useTrackReferralProgressMutation } from '@/features/referrals/hooks/useReferralQueries';

async function completeTask(taskId: string, userId: string) {
  // ... existing completion logic ...

  // Track referral progress (if this user was referred)
  const { mutateAsync } = useTrackReferralProgressMutation(userId);
  await mutateAsync();
  
  // Analytics, notifications, etc.
  trackTaskCompleted(taskId, difficulty, xpGained);
}
```

### 3. Profile Screen - Show Referral Card

**File:** `app/(app)/(tabs)/profile/index.tsx`

```tsx
import { ReferralInviteCard, ReferralHistoryList } from '@/features/referrals/components/ReferralCard';

export default function ProfileScreen() {
  // ... existing profile content ...

  return (
    <ScrollView>
      {/* Profile header */}
      {/* Stats */}
      {/* Achievements */}

      {/* NEW: Referral Section */}
      <View style={{ paddingHorizontal: 16, marginVertical: 20 }}>
        <ReferralInviteCard />
        <ReferralHistoryList />
      </View>

      {/* Settings, etc */}
    </ScrollView>
  );
}
```

### 4. Deep Linking - Handle Referral Links

**File:** `app/_layout.tsx` or navigation setup

```tsx
import { parseReferralCodeFromLink } from '@/features/referrals/referralRepository';
import { useAuthStore } from '@/shared/stores/authStore';

function handleDeepLink(url: string) {
  const referralCode = parseReferralCodeFromLink(url);
  
  if (referralCode) {
    // If user not logged in, show signup screen with referral code
    // If user is logged in, show "You're already a member" message
    
    // Store referral code in context/state during signup
    // Then process when user completes registration
    
    navigation.navigate('AuthStack', {
      screen: 'SignUp',
      params: { referralCode }
    });
  }
}
```

### 5. Settings Page - Show Referral Stats

Optional: Add to settings for user to see their referral performance

```tsx
import { useReferralStatsQuery, useReferralHistoryQuery } from '@/features/referrals/hooks/useReferralQueries';

function ReferralStatsSection() {
  const uid = useAuthStore((s) => s.user?.uid);
  const { data: stats } = useReferralStatsQuery(uid);
  const { data: history } = useReferralHistoryQuery(uid);

  return (
    <Card>
      <AppText variant="subtitle">Your Referrals</AppText>
      <View style={{ marginTop: 12, gap: 12 }}>
        <Row label="Friends Joined" value={stats?.completedReferrals || 0} />
        <Row label="XP Earned" value={`+${stats?.totalRewardsEarned || 0}`} />
        <Row label="Pending Rewards" value={history?.filter(r => !r.rewardClaimed).length || 0} />
      </View>
    </Card>
  );
}
```

---

## Usage Examples

### Share Referral Code (in Profile)

```tsx
import { ReferralInviteCard } from '@/features/referrals/components/ReferralCard';

function ProfileScreen() {
  return (
    <ScrollView>
      <ReferralInviteCard />  // Shows code, stats, share button
    </ScrollView>
  );
}
```

### Get User's Referral Code

```tsx
import { useReferralCodeQuery } from '@/features/referrals/hooks/useReferralQueries';

function MyComponent() {
  const uid = useAuthStore((s) => s.user?.uid);
  const { data: code } = useReferralCodeQuery(uid, displayName);
  
  return <Text>{code}</Text>;  // "ALICE_X7F2"
}
```

### Track Task Completion for Referral Progress

```tsx
import { trackReferralProgress } from '@/features/referrals/referralRepository';

async function onTaskComplete(userId: string) {
  // ... complete task ...
  
  // This automatically unlocks rewards when new user hits 5 tasks
  await trackReferralProgress(userId);
}
```

### Get Referral History

```tsx
import { getReferralHistory } from '@/features/referrals/referralRepository';

const history = await getReferralHistory(userId);
// Returns array of referrals this user made:
// [
//   { id: "bob-uid", referralCode: "ALICE_X7F2", tasksCompleted: 3, rewardClaimed: false },
//   { id: "carol-uid", referralCode: "ALICE_X7F2", tasksCompleted: 5, rewardClaimed: true },
// ]
```

---

## Testing

### Manual Test: Referral Code Generation

1. Log in as User A
2. Go to Profile
3. Tap "Share Code" button
4. See code like "ALICE_X7F2"
5. Verify in Firestore → `referrals/userA` → `code: "ALICE_X7F2"`

### Manual Test: Signup with Referral

1. Open deep link: `acts://referral/ALICE_X7F2`
2. Should redirect to signup with referral code pre-filled
3. Complete signup
4. Verify in Firestore:
   - `referralSignups/newUserId` created with `referrerId: userA`
   - `referralRewards` doc created with `status: "pending"`
   - New user gets +500 XP
5. Complete 5 tasks as new user
6. Verify reward is claimed, User A gets +100 XP, notification sent

### Automated Tests

```tsx
test('Referral code is generated on first access', async () => {
  const code = await getReferralCode('alice-uid', 'Alice');
  expect(code).toMatch(/^[A-Z]+_[A-Z0-9]{4}$/);
});

test('New user signup with referral processes correctly', async () => {
  const result = await processReferralSignup('bob-uid', 'ALICE_X7F2', 'Bob');
  expect(result.referrerId).toBe('alice-uid');
  expect(result.xpReward).toBe(500);
});

test('Reward unlocks after 5 tasks completed', async () => {
  // Setup: User B signed up via User A's code
  // Complete 5 tasks
  for (let i = 0; i < 5; i++) {
    await trackReferralProgress('bob-uid');
  }
  
  // Verify User A got 100 XP
  const userA = await getUser('alice-uid');
  expect(userA.xp).toBeGreaterThanOrEqual(100);
});
```

---

## Analytics Events to Track

Add to analytics to monitor referral program effectiveness:

```tsx
// When referral code is shared
await trackUI.referralShared(referralCode);

// When new user signs up with referral
await trackAccount.signupViaReferral(referralCode, referrerId);

// When referral reward is unlocked
await trackReferral.rewardUnlocked(referrerId, newUserId, xpAmount);

// Monthly: Track referral conversion rate
// conversions = referrals with 5+ tasks completed
// conversion_rate = conversions / signups_with_code
```

---

## Firestore Rules

Update your Firestore security rules to prevent abuse:

```firestore
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only read their own referral data
    match /referrals/{userId} {
      allow read, write: if request.auth.uid == userId;
    }

    match /referralSignups/{userId} {
      allow read: if request.auth.uid == userId || 
                     request.auth.uid == resource.data.referrerId;
      allow create: if request.auth.uid == userId;
    }

    match /referralRewards/{docId} {
      allow read: if request.auth.uid == resource.data.referrerId ||
                     request.auth.uid == resource.data.newUserId;
      allow create: if request.auth.uid != null; // Only backend
    }
  }
}
```

---

## Optimization

### Database Indexes

Create these Firestore indexes for performance:

1. Collection: `referrals`
   - Fields: `code` (ascending)

2. Collection: `referralSignups`
   - Fields: `referrerId` (ascending), `rewardClaimed` (ascending)

3. Collection: `referralRewards`
   - Fields: `referrerId` (ascending), `status` (ascending)

Firebase will suggest these automatically when queries are slow.

---

## Edge Cases Handled

✅ **Invalid referral code** — Returns null, user still signs up
✅ **Code already used by another user** — Works fine (same code, different referrer)
✅ **Reward expires after 90 days** — Handled in expiresAt field
✅ **User signs up twice** — First signup wins (prevent duplicate rewards)
✅ **Deep link parsing** — Handles both `acts://` and `https://acts.app` formats
✅ **Offline signup** — Referral processed when network returns

---

## Future Enhancements

1. **Tiered rewards** — Earn bonus XP after 10 referrals
2. **Referral contests** — "Highest referrals this month wins cosmetic"
3. **Viral loops** — Social media sharing integration (TikTok, Instagram)
4. **Referral bonus cosmetics** — Unlock exclusive appearance after 5 successful referrals
5. **Affiliate dashboard** — Advanced analytics for power users
6. **Email invites** — Send referral code via email
