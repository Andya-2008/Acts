import type { ComponentProps } from 'react';
import type Ionicons from '@expo/vector-icons/Ionicons';

export type IonIconName = NonNullable<ComponentProps<typeof Ionicons>['name']>;

export type AchievementCategory = 'streak' | 'xp' | 'acts' | 'deed_feed';

export type AchievementMetric =
  | { kind: 'streak_min'; days: number }
  | { kind: 'xp_min'; xp: number }
  | { kind: 'acts_min'; n: number }
  | { kind: 'deed_posts_min'; n: number };

export type AchievementDef = {
  id: string;
  category: AchievementCategory;
  title: string;
  description: string;
  /** Ionicons glyph name (filled variants where available). */
  icon: IonIconName;
  metric: AchievementMetric;
  /** Accent for unlocked tiles (hex). */
  accentHex: string;
};

/** Inputs derived from tasks, userInfo, and deed posts. */
export type AchievementMetrics = {
  streakDays: number;
  lifetimeXp: number;
  actsCompleted: number;
  deedPostsAuthored: number;
};

export function achievementMet(metric: AchievementMetric, m: AchievementMetrics): boolean {
  switch (metric.kind) {
    case 'streak_min':
      return m.streakDays >= metric.days;
    case 'xp_min':
      return m.lifetimeXp >= metric.xp;
    case 'acts_min':
      return m.actsCompleted >= metric.n;
    case 'deed_posts_min':
      return m.deedPostsAuthored >= metric.n;
  }
}

export function isAchievementUnlocked(def: AchievementDef, m: AchievementMetrics): boolean {
  return achievementMet(def.metric, m);
}

/**
 * All achievements (order = celebration queue order for multiple new unlocks).
 * Keep ids stable for AsyncStorage.
 */
export const ACHIEVEMENTS: AchievementDef[] = [
  // Streak
  { id: 'streak_1', category: 'streak', title: 'Day one', description: 'Reach a 1-day streak.', icon: 'sunny', metric: { kind: 'streak_min', days: 1 }, accentHex: '#FBBF24' },
  { id: 'streak_2', category: 'streak', title: 'Warm up', description: 'Reach a 2-day streak.', icon: 'flame', metric: { kind: 'streak_min', days: 2 }, accentHex: '#EA580C' },
  { id: 'streak_3', category: 'streak', title: 'On a roll', description: 'Reach a 3-day streak.', icon: 'bonfire', metric: { kind: 'streak_min', days: 3 }, accentHex: '#EA580C' },
  { id: 'streak_5', category: 'streak', title: 'Steady spark', description: 'Reach a 5-day streak.', icon: 'flame', metric: { kind: 'streak_min', days: 5 }, accentHex: '#F97316' },
  { id: 'streak_7', category: 'streak', title: 'Week warrior', description: 'Reach a 7-day streak.', icon: 'ribbon', metric: { kind: 'streak_min', days: 7 }, accentHex: '#FB923C' },
  { id: 'streak_10', category: 'streak', title: 'Ten strong', description: 'Reach a 10-day streak.', icon: 'trophy', metric: { kind: 'streak_min', days: 10 }, accentHex: '#F59E0B' },
  { id: 'streak_14', category: 'streak', title: 'Fortnight focus', description: 'Reach a 14-day streak.', icon: 'medal', metric: { kind: 'streak_min', days: 14 }, accentHex: '#EAB308' },
  { id: 'streak_21', category: 'streak', title: 'Habit hero', description: 'Reach a 21-day streak.', icon: 'star', metric: { kind: 'streak_min', days: 21 }, accentHex: '#CA8A04' },
  { id: 'streak_30', category: 'streak', title: 'Monthly momentum', description: 'Reach a 30-day streak.', icon: 'trophy', metric: { kind: 'streak_min', days: 30 }, accentHex: '#A16207' },
  { id: 'streak_45', category: 'streak', title: 'Deep roots', description: 'Reach a 45-day streak.', icon: 'leaf', metric: { kind: 'streak_min', days: 45 }, accentHex: '#15803D' },
  { id: 'streak_60', category: 'streak', title: 'Two-month flame', description: 'Reach a 60-day streak.', icon: 'flame', metric: { kind: 'streak_min', days: 60 }, accentHex: '#16A34A' },
  { id: 'streak_90', category: 'streak', title: 'Quarter champion', description: 'Reach a 90-day streak.', icon: 'ribbon', metric: { kind: 'streak_min', days: 90 }, accentHex: '#059669' },
  { id: 'streak_120', category: 'streak', title: 'Season of service', description: 'Reach a 120-day streak.', icon: 'sunny', metric: { kind: 'streak_min', days: 120 }, accentHex: '#0D9488' },
  { id: 'streak_180', category: 'streak', title: 'Half-year heart', description: 'Reach a 180-day streak.', icon: 'heart', metric: { kind: 'streak_min', days: 180 }, accentHex: '#E11D74' },
  { id: 'streak_365', category: 'streak', title: 'Year of light', description: 'Reach a 365-day streak.', icon: 'sparkles', metric: { kind: 'streak_min', days: 365 }, accentHex: '#7C3AED' },
  { id: 'streak_500', category: 'streak', title: 'Five hundred sunrises', description: 'Reach a 500-day streak.', icon: 'sunny', metric: { kind: 'streak_min', days: 500 }, accentHex: '#6D28D9' },
  { id: 'streak_730', category: 'streak', title: 'Two-year torch', description: 'Reach a 730-day (2-year) streak.', icon: 'flame', metric: { kind: 'streak_min', days: 730 }, accentHex: '#5B21B6' },
  { id: 'streak_1000', category: 'streak', title: 'Thousand-day discipline', description: 'Reach a 1,000-day streak.', icon: 'trophy', metric: { kind: 'streak_min', days: 1000 }, accentHex: '#4C1D95' },
  { id: 'streak_1095', category: 'streak', title: 'Three-year devotion', description: 'Reach a 1,095-day (3-year) streak.', icon: 'medal', metric: { kind: 'streak_min', days: 1095 }, accentHex: '#4338CA' },
  { id: 'streak_1460', category: 'streak', title: 'Four-year flame', description: 'Reach a 1,460-day (4-year) streak.', icon: 'ribbon', metric: { kind: 'streak_min', days: 1460 }, accentHex: '#3730A3' },
  { id: 'streak_1825', category: 'streak', title: 'Five-year cornerstone', description: 'Reach a 1,825-day (5-year) streak.', icon: 'planet', metric: { kind: 'streak_min', days: 1825 }, accentHex: '#312E81' },

  // XP
  { id: 'xp_10', category: 'xp', title: 'First spark', description: 'Earn 10 lifetime XP.', icon: 'flash', metric: { kind: 'xp_min', xp: 10 }, accentHex: '#FACC15' },
  { id: 'xp_25', category: 'xp', title: 'First glow', description: 'Earn 25 lifetime XP.', icon: 'sparkles', metric: { kind: 'xp_min', xp: 25 }, accentHex: '#CA8A04' },
  { id: 'xp_50', category: 'xp', title: 'Rising light', description: 'Earn 50 lifetime XP.', icon: 'star-half', metric: { kind: 'xp_min', xp: 50 }, accentHex: '#EAB308' },
  { id: 'xp_100', category: 'xp', title: 'Century spark', description: 'Earn 100 lifetime XP.', icon: 'star', metric: { kind: 'xp_min', xp: 100 }, accentHex: '#F59E0B' },
  { id: 'xp_250', category: 'xp', title: 'Bright path', description: 'Earn 250 lifetime XP.', icon: 'star', metric: { kind: 'xp_min', xp: 250 }, accentHex: '#F97316' },
  { id: 'xp_500', category: 'xp', title: 'Half thousand', description: 'Earn 500 lifetime XP.', icon: 'ribbon', metric: { kind: 'xp_min', xp: 500 }, accentHex: '#EA580C' },
  { id: 'xp_750', category: 'xp', title: 'Warm beam', description: 'Earn 750 lifetime XP.', icon: 'sunny', metric: { kind: 'xp_min', xp: 750 }, accentHex: '#FB923C' },
  { id: 'xp_1000', category: 'xp', title: 'Thousandfold', description: 'Earn 1,000 lifetime XP.', icon: 'trophy', metric: { kind: 'xp_min', xp: 1000 }, accentHex: '#D97706' },
  { id: 'xp_1500', category: 'xp', title: 'Deep gold', description: 'Earn 1,500 lifetime XP.', icon: 'medal', metric: { kind: 'xp_min', xp: 1500 }, accentHex: '#B45309' },
  { id: 'xp_2000', category: 'xp', title: 'Twin thousand', description: 'Earn 2,000 lifetime XP.', icon: 'star', metric: { kind: 'xp_min', xp: 2000 }, accentHex: '#B45309' },
  { id: 'xp_2500', category: 'xp', title: 'Radiant', description: 'Earn 2,500 lifetime XP.', icon: 'diamond', metric: { kind: 'xp_min', xp: 2500 }, accentHex: '#A16207' },
  { id: 'xp_3000', category: 'xp', title: 'Tri-beam', description: 'Earn 3,000 lifetime XP.', icon: 'flash', metric: { kind: 'xp_min', xp: 3000 }, accentHex: '#A16207' },
  { id: 'xp_4000', category: 'xp', title: 'Fourfold', description: 'Earn 4,000 lifetime XP.', icon: 'ribbon', metric: { kind: 'xp_min', xp: 4000 }, accentHex: '#92400E' },
  { id: 'xp_5000', category: 'xp', title: 'Beacon', description: 'Earn 5,000 lifetime XP.', icon: 'flash', metric: { kind: 'xp_min', xp: 5000 }, accentHex: '#92400E' },
  { id: 'xp_6000', category: 'xp', title: 'Sixfold shine', description: 'Earn 6,000 lifetime XP.', icon: 'sunny', metric: { kind: 'xp_min', xp: 6000 }, accentHex: '#7C2D12' },
  { id: 'xp_7500', category: 'xp', title: 'Steady blaze', description: 'Earn 7,500 lifetime XP.', icon: 'flame', metric: { kind: 'xp_min', xp: 7500 }, accentHex: '#7C2D12' },
  { id: 'xp_8000', category: 'xp', title: 'Eightfold path', description: 'Earn 8,000 lifetime XP.', icon: 'planet', metric: { kind: 'xp_min', xp: 8000 }, accentHex: '#6D28D9' },
  { id: 'xp_10000', category: 'xp', title: 'Ten thousand', description: 'Earn 10,000 lifetime XP.', icon: 'rocket', metric: { kind: 'xp_min', xp: 10000 }, accentHex: '#6D28D9' },
  { id: 'xp_12000', category: 'xp', title: 'Twelve stars', description: 'Earn 12,000 lifetime XP.', icon: 'moon', metric: { kind: 'xp_min', xp: 12000 }, accentHex: '#5B21B6' },
  { id: 'xp_15000', category: 'xp', title: 'High orbit', description: 'Earn 15,000 lifetime XP.', icon: 'planet', metric: { kind: 'xp_min', xp: 15000 }, accentHex: '#5B21B6' },
  { id: 'xp_20000', category: 'xp', title: 'Twenty thousand', description: 'Earn 20,000 lifetime XP.', icon: 'rocket', metric: { kind: 'xp_min', xp: 20000 }, accentHex: '#4C1D95' },
  { id: 'xp_25000', category: 'xp', title: 'Constellation', description: 'Earn 25,000 lifetime XP.', icon: 'moon', metric: { kind: 'xp_min', xp: 25000 }, accentHex: '#4C1D95' },
  { id: 'xp_35000', category: 'xp', title: 'Thirty-five K', description: 'Earn 35,000 lifetime XP.', icon: 'infinite', metric: { kind: 'xp_min', xp: 35000 }, accentHex: '#3730A3' },
  { id: 'xp_50000', category: 'xp', title: 'Legend of light', description: 'Earn 50,000 lifetime XP.', icon: 'library', metric: { kind: 'xp_min', xp: 50000 }, accentHex: '#312E81' },
  { id: 'xp_75000', category: 'xp', title: 'Seventy-five K', description: 'Earn 75,000 lifetime XP.', icon: 'rocket', metric: { kind: 'xp_min', xp: 75000 }, accentHex: '#2E1065' },
  { id: 'xp_100000', category: 'xp', title: 'Hundred K horizon', description: 'Earn 100,000 lifetime XP.', icon: 'planet', metric: { kind: 'xp_min', xp: 100000 }, accentHex: '#1E1B4B' },
  { id: 'xp_150000', category: 'xp', title: 'Deep orbit', description: 'Earn 150,000 lifetime XP.', icon: 'moon', metric: { kind: 'xp_min', xp: 150000 }, accentHex: '#172554' },
  { id: 'xp_200000', category: 'xp', title: 'Twin hundred K', description: 'Earn 200,000 lifetime XP.', icon: 'infinite', metric: { kind: 'xp_min', xp: 200000 }, accentHex: '#0F172A' },
  { id: 'xp_300000', category: 'xp', title: 'Three hundred K', description: 'Earn 300,000 lifetime XP.', icon: 'sparkles', metric: { kind: 'xp_min', xp: 300000 }, accentHex: '#0C4A6E' },
  { id: 'xp_500000', category: 'xp', title: 'Half-million glow', description: 'Earn 500,000 lifetime XP.', icon: 'flash', metric: { kind: 'xp_min', xp: 500000 }, accentHex: '#164E63' },

  // Acts completed
  { id: 'acts_1', category: 'acts', title: 'First act', description: 'Complete your first act.', icon: 'checkmark-circle', metric: { kind: 'acts_min', n: 1 }, accentHex: '#15803D' },
  { id: 'acts_2', category: 'acts', title: 'Second step', description: 'Complete 2 acts.', icon: 'footsteps', metric: { kind: 'acts_min', n: 2 }, accentHex: '#22C55E' },
  { id: 'acts_3', category: 'acts', title: 'Triple kindness', description: 'Complete 3 acts.', icon: 'heart', metric: { kind: 'acts_min', n: 3 }, accentHex: '#16A34A' },
  { id: 'acts_5', category: 'acts', title: 'High five', description: 'Complete 5 acts.', icon: 'hand-left', metric: { kind: 'acts_min', n: 5 }, accentHex: '#22C55E' },
  { id: 'acts_10', category: 'acts', title: 'Decade of deeds', description: 'Complete 10 acts.', icon: 'flower', metric: { kind: 'acts_min', n: 10 }, accentHex: '#4ADE80' },
  { id: 'acts_15', category: 'acts', title: 'Fifteen fold', description: 'Complete 15 acts.', icon: 'leaf', metric: { kind: 'acts_min', n: 15 }, accentHex: '#86EFAC' },
  { id: 'acts_25', category: 'acts', title: 'Quarter century', description: 'Complete 25 acts.', icon: 'rose', metric: { kind: 'acts_min', n: 25 }, accentHex: '#059669' },
  { id: 'acts_40', category: 'acts', title: 'Forty forward', description: 'Complete 40 acts.', icon: 'navigate', metric: { kind: 'acts_min', n: 40 }, accentHex: '#0D9488' },
  { id: 'acts_50', category: 'acts', title: 'Half hundred', description: 'Complete 50 acts.', icon: 'trophy', metric: { kind: 'acts_min', n: 50 }, accentHex: '#14B8A6' },
  { id: 'acts_75', category: 'acts', title: 'Seventy-five strong', description: 'Complete 75 acts.', icon: 'ribbon', metric: { kind: 'acts_min', n: 75 }, accentHex: '#0EA5E9' },
  { id: 'acts_100', category: 'acts', title: 'Century club', description: 'Complete 100 acts.', icon: 'medal', metric: { kind: 'acts_min', n: 100 }, accentHex: '#0284C7' },
  { id: 'acts_150', category: 'acts', title: 'One-fifty', description: 'Complete 150 acts.', icon: 'star', metric: { kind: 'acts_min', n: 150 }, accentHex: '#0369A1' },
  { id: 'acts_200', category: 'acts', title: 'Double century', description: 'Complete 200 acts.', icon: 'sparkles', metric: { kind: 'acts_min', n: 200 }, accentHex: '#1D4ED8' },
  { id: 'acts_300', category: 'acts', title: 'Triple hundred', description: 'Complete 300 acts.', icon: 'planet', metric: { kind: 'acts_min', n: 300 }, accentHex: '#4338CA' },
  { id: 'acts_500', category: 'acts', title: 'Five hundred', description: 'Complete 500 acts.', icon: 'rocket', metric: { kind: 'acts_min', n: 500 }, accentHex: '#5B21B6' },
  { id: 'acts_1000', category: 'acts', title: 'Thousand acts', description: 'Complete 1,000 acts.', icon: 'infinite', metric: { kind: 'acts_min', n: 1000 }, accentHex: '#4C1D95' },
  { id: 'acts_1500', category: 'acts', title: 'Fifteen hundred', description: 'Complete 1,500 acts.', icon: 'rose', metric: { kind: 'acts_min', n: 1500 }, accentHex: '#5B21B6' },
  { id: 'acts_2000', category: 'acts', title: 'Two thousand deeds', description: 'Complete 2,000 acts.', icon: 'trophy', metric: { kind: 'acts_min', n: 2000 }, accentHex: '#6D28D9' },
  { id: 'acts_3500', category: 'acts', title: 'Thirty-five hundred', description: 'Complete 3,500 acts.', icon: 'ribbon', metric: { kind: 'acts_min', n: 3500 }, accentHex: '#7C3AED' },
  { id: 'acts_5000', category: 'acts', title: 'Five thousand acts', description: 'Complete 5,000 acts.', icon: 'planet', metric: { kind: 'acts_min', n: 5000 }, accentHex: '#5B21B6' },

  // Deed feed - every authored post counts (including shares from Memories / Tasks with a photo).
  { id: 'deed_post_1', category: 'deed_feed', title: 'Feed debut', description: 'Publish your first deed post.', icon: 'images', metric: { kind: 'deed_posts_min', n: 1 }, accentHex: '#E11D74' },
  { id: 'deed_post_3', category: 'deed_feed', title: 'Story trio', description: 'Publish 3 deed posts.', icon: 'camera', metric: { kind: 'deed_posts_min', n: 3 }, accentHex: '#DB2777' },
  { id: 'deed_post_5', category: 'deed_feed', title: 'Feed regular', description: 'Publish 5 deed posts.', icon: 'aperture', metric: { kind: 'deed_posts_min', n: 5 }, accentHex: '#BE185D' },
  { id: 'deed_post_10', category: 'deed_feed', title: 'Story stream', description: 'Publish 10 deed posts.', icon: 'film', metric: { kind: 'deed_posts_min', n: 10 }, accentHex: '#9D174D' },
  { id: 'deed_post_20', category: 'deed_feed', title: 'Community canvas', description: 'Publish 20 deed posts.', icon: 'color-palette', metric: { kind: 'deed_posts_min', n: 20 }, accentHex: '#831843' },
  { id: 'deed_post_35', category: 'deed_feed', title: 'Gallery heart', description: 'Publish 35 deed posts.', icon: 'heart-circle', metric: { kind: 'deed_posts_min', n: 35 }, accentHex: '#BE123C' },
  { id: 'deed_post_50', category: 'deed_feed', title: 'Feed luminary', description: 'Publish 50 deed posts.', icon: 'megaphone', metric: { kind: 'deed_posts_min', n: 50 }, accentHex: '#F43F5E' },
  { id: 'deed_post_75', category: 'deed_feed', title: 'Seventy-five stories', description: 'Publish 75 deed posts.', icon: 'newspaper', metric: { kind: 'deed_posts_min', n: 75 }, accentHex: '#E11D74' },
  { id: 'deed_post_100', category: 'deed_feed', title: 'Century of posts', description: 'Publish 100 deed posts.', icon: 'albums', metric: { kind: 'deed_posts_min', n: 100 }, accentHex: '#DB2777' },
  { id: 'deed_post_150', category: 'deed_feed', title: 'Story marathon', description: 'Publish 150 deed posts.', icon: 'book', metric: { kind: 'deed_posts_min', n: 150 }, accentHex: '#BE185D' },
  { id: 'deed_post_200', category: 'deed_feed', title: 'Double hundred posts', description: 'Publish 200 deed posts.', icon: 'library', metric: { kind: 'deed_posts_min', n: 200 }, accentHex: '#9D174D' },
  { id: 'deed_post_350', category: 'deed_feed', title: 'Feed veteran', description: 'Publish 350 deed posts.', icon: 'planet', metric: { kind: 'deed_posts_min', n: 350 }, accentHex: '#831843' },
  { id: 'deed_post_500', category: 'deed_feed', title: 'Five hundred spotlights', description: 'Publish 500 deed posts.', icon: 'rocket', metric: { kind: 'deed_posts_min', n: 500 }, accentHex: '#581C87' },
  { id: 'deed_post_750', category: 'deed_feed', title: 'Seven-fifty chronicles', description: 'Publish 750 deed posts.', icon: 'earth', metric: { kind: 'deed_posts_min', n: 750 }, accentHex: '#4C1D95' },
  { id: 'deed_post_1000', category: 'deed_feed', title: 'Thousand on the wall', description: 'Publish 1,000 deed posts.', icon: 'infinite', metric: { kind: 'deed_posts_min', n: 1000 }, accentHex: '#312E81' },
];

export const ACHIEVEMENT_BY_ID: Record<string, AchievementDef> = Object.fromEntries(ACHIEVEMENTS.map((a) => [a.id, a]));

export const ACHIEVEMENT_SECTION_ORDER: AchievementCategory[] = ['streak', 'xp', 'acts', 'deed_feed'];

export const ACHIEVEMENT_SECTION_LABEL: Record<AchievementCategory, string> = {
  streak: 'Streak',
  xp: 'Lifetime XP',
  acts: 'Acts completed',
  deed_feed: 'Deed feed posts',
};

export function computeUnlockedAchievementIds(m: AchievementMetrics): string[] {
  return ACHIEVEMENTS.filter((a) => isAchievementUnlocked(a, m)).map((a) => a.id);
}

/** Longer copy for the achievement detail sheet (how to actually earn it in-app). */
export function achievementHowToUnlock(def: AchievementDef): string {
  switch (def.metric.kind) {
    case 'streak_min': {
      const n = def.metric.days;
      return `Your streak counts consecutive calendar days where you complete at least one act. Skip a day and the streak resets to zero. Hit ${n} day${n === 1 ? '' : 's'} in a row to unlock this badge.`;
    }
    case 'xp_min': {
      const xp = def.metric.xp;
      return `Lifetime XP adds up from completing acts, sharing completed acts to the deed feed, and buying XP in the shop. Grow your lifetime total to ${xp.toLocaleString()} XP.`;
    }
    case 'acts_min': {
      const n = def.metric.n;
      return `Every time you check an act off your task list, it counts toward this goal (any cadence-daily, weekly, etc.). Reach ${n.toLocaleString()} completed act${n === 1 ? '' : 's'} total.`;
    }
    case 'deed_posts_min': {
      const n = def.metric.n;
      return `Each deed post you author counts-including when you share a completed act (with a photo) from Tasks or Memories to the feed. Publish ${n} post${n === 1 ? '' : 's'} total.`;
    }
  }
}

/** Short progress line for the detail modal (current vs requirement). */
export function achievementProgressSummary(def: AchievementDef, m: AchievementMetrics): string {
  switch (def.metric.kind) {
    case 'streak_min':
      return `${Math.min(m.streakDays, def.metric.days)} / ${def.metric.days} streak days`;
    case 'xp_min':
      return `${Math.min(m.lifetimeXp, def.metric.xp).toLocaleString()} / ${def.metric.xp.toLocaleString()} lifetime XP`;
    case 'acts_min':
      return `${Math.min(m.actsCompleted, def.metric.n)} / ${def.metric.n} acts completed`;
    case 'deed_posts_min':
      return `${Math.min(m.deedPostsAuthored, def.metric.n)} / ${def.metric.n} deed posts`;
  }
}

export const ACHIEVEMENT_SECTION_FLAVOR: Record<AchievementCategory, { icon: IonIconName; tagline: string }> = {
  streak: { icon: 'flame', tagline: 'Daily streak power-ups' },
  xp: { icon: 'flash', tagline: 'Climb the lifetime XP ladder' },
  acts: { icon: 'leaf', tagline: 'Acts of service milestones' },
  deed_feed: { icon: 'images', tagline: 'Stories you put on the feed' },
};
