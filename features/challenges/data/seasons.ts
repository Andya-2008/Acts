/**
 * Client-defined seasonal challenges (no Firestore `seasons` collection needed).
 *
 * The active season is always the current calendar month, so it never expires and
 * requires no server-side seeding. User progress is stored per-user under
 * `userInfo/{uid}/seasonProgress/{seasonId}` (writable only by that user per security rules),
 * and XP is granted through the same `grantLifetimeXp` path the rest of the app uses.
 */

export type SeasonalChallenge = {
  id: string;
  title: string;
  description: string;
  icon: string;
  /** Base XP before the season bonus multiplier. */
  xpReward: number;
  /** How many times it can be completed this season. */
  maxCompletions: number;
};

export type SeasonalSeason = {
  /** Stable id for the month, e.g. `2026-05`. */
  id: string;
  name: string;
  subtitle: string;
  themeColor: string;
  startDate: Date;
  endDate: Date;
  /** Multiplier applied to each challenge's base XP (e.g. 1.5 = +50%). */
  bonusXpMultiplier: number;
  challenges: SeasonalChallenge[];
};

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

/** Evergreen kindness challenges offered every season. */
const SEASONAL_CHALLENGES: readonly SeasonalChallenge[] = [
  {
    id: 'reach-out',
    title: 'Reach out to someone you miss',
    description: 'Call or message someone you haven\u2019t talked to in a while.',
    icon: '📞',
    xpReward: 50,
    maxCompletions: 5,
  },
  {
    id: 'thank-you-note',
    title: 'Write a thank-you note',
    description: 'Tell someone, in writing, why you appreciate them.',
    icon: '📝',
    xpReward: 75,
    maxCompletions: 5,
  },
  {
    id: 'compliment',
    title: 'Give a genuine compliment',
    description: 'Make someone\u2019s day with a specific, sincere compliment.',
    icon: '😊',
    xpReward: 30,
    maxCompletions: 10,
  },
  {
    id: 'help-hand',
    title: 'Help someone who needs it',
    description: 'Offer a hand to a friend, neighbor, or stranger.',
    icon: '🤝',
    xpReward: 100,
    maxCompletions: 5,
  },
  {
    id: 'give-back',
    title: 'Volunteer or donate',
    description: 'Give your time or resources to a cause you believe in.',
    icon: '🙌',
    xpReward: 150,
    maxCompletions: 3,
  },
  {
    id: 'teach',
    title: 'Teach or mentor someone',
    description: 'Share something you know with someone who wants to learn.',
    icon: '👩\u200d🏫',
    xpReward: 200,
    maxCompletions: 3,
  },
];

/** The active season for `now` — always the current calendar month. */
export function getActiveSeason(now: Date = new Date()): SeasonalSeason {
  const year = now.getFullYear();
  const monthIndex = now.getMonth();
  const startDate = new Date(year, monthIndex, 1, 0, 0, 0, 0);
  const endDate = new Date(year, monthIndex + 1, 0, 23, 59, 59, 999);
  const id = `${year}-${String(monthIndex + 1).padStart(2, '0')}`;

  return {
    id,
    name: `${MONTH_NAMES[monthIndex]} Acts of Kindness`,
    subtitle: 'Complete kindness challenges for bonus XP this month.',
    themeColor: '#F472B6',
    startDate,
    endDate,
    bonusXpMultiplier: 1.5,
    challenges: [...SEASONAL_CHALLENGES],
  };
}

/** Whole days left in the season (0 on the final day). */
export function seasonDaysRemaining(season: SeasonalSeason, now: Date = new Date()): number {
  const ms = season.endDate.getTime() - now.getTime();
  return Math.max(0, Math.floor(ms / (1000 * 60 * 60 * 24)));
}
