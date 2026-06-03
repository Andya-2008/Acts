# Analytics & Error Tracking Setup Guide

## Overview

Acts now has **two integrated tracking systems** for monitoring app health and user behavior:

1. **Firebase Analytics** (automatic) — User behavior, engagement metrics
2. **Sentry** (optional) — Crash reporting and error tracking

Both are FREE and configured to work together.

---

## Firebase Analytics (Automatic)

### Setup
Firebase Analytics is **automatically enabled** with your Firebase project. No additional code needed.

### What It Tracks
- User sign-ups and sign-ins
- Task completions (with XP earned)
- Deed post creation and engagement
- Shop purchases
- Achievement unlocks
- Settings changes
- Error events
- Screen navigation
- Referrals
- Challenge participation

### Dashboard
Access at: **[Firebase Console → Acts Project → Analytics](https://console.firebase.google.com/project/acts-d7c7f/analytics)**

### Key Metrics to Monitor
1. **DAU/MAU** (Daily/Monthly Active Users)
   - Tells you if users are returning
   - Target: >50% day-1 retention, >20% day-7 retention

2. **Task Completion Rate**
   - % of DAU completing ≥1 task
   - Target: >30% (indicates engagement)

3. **Deed Feed Engagement**
   - Posts per day, reactions, comments
   - Target: >10% of DAU posting deeds

4. **Shop Conversion**
   - % of DAU making purchases
   - Target: >5% (indicates monetization potential)

5. **Referral Conversions**
   - Users acquired via referral link
   - Target: >10% of new signups

### Segments to Create
Use Firebase Console to create these segments for deeper analysis:

**Segment 1: Active Daily Players**
- Completed ≥1 task in last 7 days
- Use to identify core users

**Segment 2: Deed Feed Engaged**
- Posted ≥1 deed in last 30 days
- Use to identify social users

**Segment 3: Spenders**
- Made ≥1 shop purchase
- Use to identify monetization potential

**Segment 4: At-Risk Users**
- No activity in 14 days
- Use for win-back campaigns (push notifications)

---

## Sentry Error Tracking (Optional But Recommended)

### Setup Instructions

#### Step 1: Create Sentry Account
1. Go to [https://sentry.io](https://sentry.io)
2. Sign up (free tier is plenty)
3. Create new project: Select "React Native"
4. Copy your **DSN** (looks like: `https://your-key@your-org.ingest.sentry.io/your-project-id`)

#### Step 2: Add DSN to `.env`
```bash
# .env
EXPO_PUBLIC_SENTRY_DSN=https://your-key@your-org.ingest.sentry.io/your-project-id
```

#### Step 3: Done!
When you build and deploy, errors will automatically report to Sentry.

### What It Captures
- **Unhandled exceptions** (crashes)
- **Promise rejections**
- **Network errors**
- **TypeErrors, ReferenceErrors, etc.**
- **Custom breadcrumbs** (for debugging)
- **User context** (who was using the app when it crashed)
- **Device info** (OS, version, RAM, battery, etc.)

### Dashboard
Access at: **[Sentry Dashboard → Acts Project](https://sentry.io)**

### Example: Investigating a Crash

**User reports:** "App crashes when I try to post a deed photo"

**In Sentry:**
1. Go to **Issues** tab
2. Find "Cannot read property 'uri'"
3. Click to see:
   - Stack trace (exactly where it failed)
   - Breadcrumbs (what the user did before crash)
   - User context (device type, OS version, etc.)
   - Exact source code line

**Fix:** Update image handling code → deploy fix → crash goes away

### Ignoring False Positives
Sentry is configured to ignore common harmless errors:
- "Network request failed" (user went offline)
- "Cannot read property" (handled gracefully)

If you see spam from non-critical errors, update `shared/services/sentry.ts` → `ignoreErrors` array.

---

## Using Analytics in Your Code

### Tracking Custom Events
Use the `useAnalyticsTracking` hook in any component:

```tsx
import { useAnalyticsTracking } from '@/shared/hooks/useAnalyticsTracking';

export function TaskCard({ task }) {
  const { trackTask, trackUI } = useAnalyticsTracking();

  const handleCompleteTask = async () => {
    await completeTask(task.id);
    
    // Track event
    trackTask.completed(task.id, task.difficulty, xpGained);
    
    trackUI.screenViewed('task_completion_screen');
  };

  return (
    <Button onPress={handleCompleteTask}>
      Complete Task
    </Button>
  );
}
```

### Available Tracking Functions
```tsx
const {
  trackTask,        // completed
  trackDeed,        // posted, engaged
  trackFriend,      // actionPerformed
  trackShop,        // purchased
  trackAchievement, // unlocked
  trackSettings,    // changed
  trackUI,          // screenViewed
  trackError,       // occurred
  trackAccount,     // deleted
  trackReferral,    // converted
  trackChallenge,   // participated, completed
} = useAnalyticsTracking();
```

### Tracking Errors Manually
```tsx
import { captureException, addBreadcrumb } from '@/shared/services/sentry';

try {
  await uploadPhoto(photoUri);
} catch (error) {
  // Log breadcrumb (for context)
  addBreadcrumb('Photo upload failed', 'upload');
  
  // Capture error
  captureException(
    error,
    { photoUri, userID: userId },
    'error'
  );
  
  // Show user-friendly error message
  Alert.alert('Photo Upload Failed', 'Please try again');
}
```

---

## Monitoring Checklist

### Daily (Week 1 Post-Launch)
- [ ] Check Sentry dashboard for new crashes
- [ ] Review Firebase Analytics DAU
- [ ] Monitor crash-free sessions % (target: >95%)

### Weekly
- [ ] Review task completion rate
- [ ] Check retention cohorts (day-1, day-7)
- [ ] Look at top crashing screens
- [ ] Review error trends

### Monthly
- [ ] Analyze acquisition sources (referrals, organic, etc.)
- [ ] Review shop conversion funnel
- [ ] Identify drop-off points in user journeys
- [ ] Plan feature improvements based on data

---

## Key Metrics Formula

### Task Completion Rate
```
(Total tasks completed in 24h) / (DAU) × 100
Goal: >30%
```

### 7-Day Retention
```
(Users active in days 1-7 after sign-up) / (Sign-ups on day 0) × 100
Goal: >40%
```

### Shop Conversion
```
(Users who purchased in 24h) / (DAU) × 100
Goal: >5%
```

### Referral Rate
```
(New users via referral link) / (Total new users) × 100
Goal: >10%
```

---

## Troubleshooting

### Firebase Analytics Not Showing Data?
1. Make sure `getAnalyticsInstance()` is called at app startup
2. Wait 24 hours for data to appear (Firebase batches events)
3. Check **DebugView** in Firebase Console (real-time testing)
4. Verify EXPO_PUBLIC_FIREBASE_PROJECT_ID matches your Firebase project

### Sentry Not Reporting Crashes?
1. Check `.env` has `EXPO_PUBLIC_SENTRY_DSN` set
2. Look at console for `[Sentry] Crash reporting initialized` message
3. Go to Sentry Dashboard → Settings → Client Keys
4. Verify DSN is correct (no typos)
5. Try triggering a test error:
   ```tsx
   throw new Error('Test error');
   ```

### Too Much Noise in Sentry?
1. Add error to `ignoreErrors` array in `shared/services/sentry.ts`
2. Resolve issues (mark as "Resolved")
3. Add "alert rules" to only notify on critical errors

---

## Privacy & GDPR

### What Gets Sent?
- **Firebase Analytics:** User ID, event names, properties (no IP, no emails by default)
- **Sentry:** Error stack trace, device info, breadcrumbs (no passwords, no payment info)

### What Doesn't Get Sent?
- User passwords
- Payment/credit card information
- Personal photos (only in breadcrumbs if you add them)
- Location data

### User Consent
Both Firebase and Sentry respect:
- EU GDPR
- iOS App Tracking Transparency
- Android Privacy policies

**Your Privacy Policy** (already updated) mentions:
> "We collect app activity, errors, and usage metrics to improve Acts and fix bugs."

---

## Next Steps

1. **Set up Sentry (optional but recommended):**
   - Create account at https://sentry.io
   - Add DSN to `.env`

2. **Set up Firebase Analytics dashboards:**
   - Go to [Firebase Console](https://console.firebase.google.com)
   - Create segments (Active, Engaged, At-Risk)
   - Set up alerts for critical metrics

3. **Monitor launch metrics:**
   - Week 1: Focus on crash-free rate
   - Week 2-4: Monitor retention curves
   - Month 2: Analyze referral and shop data

4. **Use data to guide decisions:**
   - If task completion <20%: Tasks too hard, reduce difficulty
   - If retention <30%: Task fatigue, expand task catalog
   - If no referrals: Referral feature needs work

---

## Resources

- **Firebase Analytics Dashboard:** https://console.firebase.google.com/project/acts-d7c7f/analytics
- **Sentry Dashboard:** https://sentry.io
- **Firebase Docs:** https://firebase.google.com/docs/analytics
- **Sentry React Native Docs:** https://docs.sentry.io/platforms/react-native/
