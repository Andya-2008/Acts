# Seasonal Challenges Framework

## Overview

Acts now has a **complete seasonal challenges system** for creating limited-time events that drive engagement:

- **Reusable framework** — Create new seasons in minutes
- **7 challenge types** — Easy to legendary difficulty tiers
- **Progressive rewards** — Cosmetics unlock at milestones (5x completions)
- **Seasonal leaderboards** — Compete for top rank this season
- **XP bonuses** — +50% XP for season tasks (configurable)
- **Exclusive cosmetics** — Season-specific appearances

First event included: **"May Acts of Kindness"** with 7 challenges.

---

## Concept

### Seasons
Time-limited events (weekly, monthly, or custom duration):
- **May 2024:** Acts of Kindness (full month)
- **June 2024:** Summer Challenge (theme: health & wellness)
- **Seasonal:** Holiday specials (Christmas, New Year, etc.)

### Challenges
Per-season tasks that users complete multiple times:
- **Easy:** "Compliment Someone" (+30 XP)
- **Normal:** "Help Someone" (+100 XP)
- **Hard:** "Mentor Someone" (+200 XP)
- **Legendary:** "Start Movement" (invite 5 friends, +500 XP)

### Rewards
- **XP Bonuses:** +50% XP when completing season tasks
- **Cosmetics:** Unlock exclusive emojis/appearances after 5x completions
- **Recognition:** Seasonal leaderboard ranking
- **Achievement:** Season completion badge

---

## Data Model

### Season Document
```firestore
seasons/{seasonId}
  name: "May Acts of Kindness"
  subtitle: "Spread kindness this May"
  description: "..."
  theme: "kindness"
  themeColor: "#F472B6"
  bannerImageUrl: "..."
  startDate: timestamp
  endDate: timestamp
  bonusXpMultiplier: 1.5
  rewardCosmeticId: "may-kindness-halo"
  createdAt: timestamp
  
  └─ challenges/{challengeId}
     title: "Call Someone You Miss"
     description: "..."
     icon: "📞"
     difficulty: "easy"
     xpReward: 50
     cosmetics: ["may-phone-emoji"]
     maxCompletions: 31
     createdAt: timestamp
  
  └─ userProgress/{userId}
     challengeCompletions:
       challenge-1: 5
       challenge-2: 3
       challenge-3: 0
     totalXpEarned: 2450
     cosmeticsUnlocked: ["may-phone-emoji"]
     completedAt: timestamp
```

---

## Creating a New Season

### Step 1: Define Season Data

```typescript
// features/challenges/data/june-season.ts

export const JUNE_SEASON_DATA = {
  name: 'Summer of Health',
  subtitle: '🏃 Get healthy this summer',
  description: 'Focus on health & wellness',
  theme: 'health',
  themeColor: '#10B981',
  startDate: new Date('2024-06-01'),
  endDate: new Date('2024-06-30'),
  bonusXpMultiplier: 1.5,
  rewardCosmeticId: 'summer-sunglasses',
  
  challenges: [
    {
      title: 'Morning Run',
      description: 'Go for a 15+ minute run',
      icon: '🏃',
      difficulty: 'normal',
      xpReward: 75,
      cosmetics: ['running-shoes-emoji'],
      maxCompletions: 30,
    },
    // ... more challenges
  ],
};
```

### Step 2: Seed to Firestore

```bash
# Update scripts/seed-seasons.mjs to include new season
# Then run:
npm run seed:seasons
```

### Step 3: Deploy

The season will automatically be:
- Visible in app 7 days before start date (countdown)
- Active when start date is reached
- Archived when end date passes
- Accessible in "Past Seasons" for history

---

## Using in Your Code

### Get Current Season

```typescript
import { useCurrentSeasonQuery } from '@/features/challenges/hooks/useSeasonalChallengeQueries';

function SeasonBanner() {
  const { data: season } = useCurrentSeasonQuery();

  if (!season) return null;

  return (
    <View style={{ backgroundColor: season.themeColor }}>
      <Text>{season.name}</Text>
      <Text>{season.subtitle}</Text>
    </View>
  );
}
```

### Display Season Challenges

```typescript
function ChallengeBrowser() {
  const { data: season } = useCurrentSeasonQuery();

  return (
    <FlatList
      data={season?.challenges || []}
      renderItem={({ item: challenge }) => (
        <ChallengeCard
          title={challenge.title}
          icon={challenge.icon}
          xpReward={challenge.xpReward}
          difficulty={challenge.difficulty}
        />
      )}
    />
  );
}
```

### Track Challenge Completion

When user completes a task that matches a season challenge:

```typescript
import { useCompleteChallengeTaskMutation } from '@/features/challenges/hooks/useSeasonalChallengeQueries';

async function onTaskComplete(taskId: string) {
  const season = await getCurrentSeason();
  if (!season) return; // No active season

  // Find matching challenge (e.g., task "Call Mom" matches "Call Someone")
  const matchingChallenge = season.challenges.find(c => 
    matchesChallengeCriteria(task, c)
  );

  if (matchingChallenge) {
    // Track as season challenge
    const { mutateAsync } = useCompleteChallengeTaskMutation(userId);
    await mutateAsync({
      seasonId: season.id,
      challengeId: matchingChallenge.id,
      xpEarned: 50, // Base XP before multiplier
    });

    // User gets: 50 XP × 1.5 multiplier = 75 XP
  }
}
```

### Show Progress

```typescript
function SeasonProgress() {
  const uid = useAuthStore((s) => s.user?.uid);
  const { data: season } = useCurrentSeasonQuery();
  const { data: progress } = useUserSeasonProgressQuery(uid, season?.id);
  const { data: percentage } = useSeasonCompletionQuery(uid, season?.id);

  return (
    <View>
      <ProgressBar value={percentage} />
      <Text>{percentage}% Complete</Text>
      <Text>+{progress?.totalXpEarned} XP Earned</Text>
    </View>
  );
}
```

### Show Seasonal Leaderboard

```typescript
function SeasonalRankings() {
  const { data: season } = useCurrentSeasonQuery();
  const { data: leaderboard } = useSeasonalLeaderboardQuery(season?.id);

  return (
    <FlatList
      data={leaderboard || []}
      renderItem={({ item }) => (
        <View>
          <Text>#{item.rank} {item.displayName}</Text>
          <Text>+{item.totalXpEarned} XP</Text>
        </View>
      )}
    />
  );
}
```

---

## Season Types & Examples

### Monthly Seasons (Recommended)
**Best for:** Recurring themes, easy to plan
- May: Kindness
- June: Health & Wellness
- July: Creativity
- August: Community
- September: Learning
- October: Halloween
- November: Gratitude
- December: Giving

### Weekly Challenges (High Engagement)
**Best for:** Short bursts, limited rewards
- Monday-Sunday events
- Rotate every week
- Lower cosmetic rewards
- Higher XP multipliers (2x)

### Seasonal (3 months)
**Best for:** Major themes, long-term engagement
- Spring (3 months): Growth & Renewal
- Summer (3 months): Adventure & Wellness
- Fall (3 months): Harvest & Gratitude
- Winter (3 months): Giving & Connection

### Holiday Events (1-2 weeks)
**Best for:** Special occasions, hype
- Valentine's Day (Feb 14-20)
- Earth Day (Apr 18-24)
- Halloween (Oct 25-31)
- Christmas (Dec 15-25)
- New Year (Dec 28-Jan 3)

---

## Difficulty Tiers & XP

```
Easy      → 30-75 XP   (5x per month)
Normal    → 100-150 XP (3-5x per month)
Hard      → 200-250 XP (1-2x per month)
Legendary → 500+ XP    (1x per season)
```

Apply season bonus multiplier (usually 1.5x) to all XP rewards.

---

## Cosmetic Rewards Strategy

### Unlock Milestones
```
5 completions  → Unlock cosmetic set (emoji, name color, etc.)
10 completions → Bonus cosmetic tier
15+ completions → Exclusive appearance variant
```

### Cosmetic Types
- **Emoji reactions:** 📞, 📝, 🤝, 💚
- **Username colors:** Gold, silver, bronze per tier
- **Background frames:** Season-specific borders
- **Profile badges:** "May Champion", "June Hero"
- **Seasonal appearance:** Halo, wings, aura effects

### Exclusive Season Cosmetics

Only available during the season:
- Users must complete challenges to unlock
- Cosmetic reward = "may-kindness-halo" (exclusive May appearance)
- After season ends: Cosmetic becomes "limited edition" unavailable
- Users who earned it keep it forever

---

## Analytics & Monitoring

Track season engagement:

```typescript
// When user views season
await trackUI.seasonalChallengeViewed(seasonId);

// When challenge is completed
await trackChallenge.participated(seasonId, challengeId);
await trackChallenge.completed(seasonId, challengeId, xpEarned);

// When cosmetic is unlocked
await trackChallenge.cosmeticUnlocked(seasonId, cosmeticId);

// Season completion
await trackChallenge.seasonCompleted(seasonId, totalXpEarned);
```

### Key Metrics
- **Participation rate:** % of DAU with ≥1 completion
- **Completion rate:** % of starters who finish all challenges
- **Cosmetic adoption:** % unlocking cosmetics
- **Season engagement:** Daily completions per participant

---

## Firestore Rules

```firestore
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Anyone can read seasons
    match /seasons/{seasonId} {
      allow read: if true;
      allow write: if false; // Admins only (use custom claims)
      
      match /challenges/{challengeId} {
        allow read: if true;
      }
      
      match /userProgress/{userId} {
        allow read: if request.auth.uid == userId;
        allow write: if request.auth.uid == userId; // Backend updates
      }
    }
  }
}
```

---

## Deployment Checklist

- [ ] Season data defined (7+ challenges)
- [ ] Cosmetics created (appearance items)
- [ ] Firestore rules updated
- [ ] Analytics events configured
- [ ] Notifications set up (season start, cosmetic unlocked)
- [ ] UI screens built (progress, leaderboard)
- [ ] Seed script tested
- [ ] Tested on iOS/Android
- [ ] Promoted in patch notes

---

## Next Steps (Phase 2)

1. **Create June season** (Summer of Health)
2. **Add seasonal shop** (cosmetics-only during season)
3. **Push notifications** (3 days left, milestones reached)
4. **Email campaigns** ("You're #2 in leaderboard!")
5. **Social sharing** ("I earned May Kindness Halo")
6. **Seasonal achievements** (unlock badges)
7. **Multiplayer challenges** (team/guild events)

---

## Resources

- **Data:** `features/challenges/data/may-season.ts`
- **Repository:** `features/challenges/seasonalChallengeRepository.ts`
- **Hooks:** `features/challenges/hooks/useSeasonalChallengeQueries.ts`
- **Seed Script:** `scripts/seed-seasons.mjs` (create)
