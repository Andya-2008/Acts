import type { TaskCatalogEntry } from '@/shared/types/task';

import { periodKeyForDate } from '@/features/tasks/utils/taskPeriodKeys';

/**
 * Canonical task catalog (traits: taskId, textShort, textLong, active, category, difficulty,
 * minAge, maxAge, traits, materials, picture, cadence from `length`).
 */
export const TASK_CATALOG: readonly TaskCatalogEntry[] = [
  {
    taskId: 'task_0000001',
    textShort: 'Thank one of your closest friends over text!',
    textLong:
      'Take a moment to reflect on one of your closest friends—the person who has been there for you through thick and thin. Now, send them a thoughtful text message expressing your gratitude. Let them know how much their friendship means to you, recall a specific memory or moment you appreciated, and tell them the impact they have had on your life. A simple, heartfelt message can brighten their day and strengthen your bond.',
    active: true,
    category: 'general',
    difficulty: 1,
    minAge: 1,
    maxAge: 999,
    traits: ['Any'],
    materials: ['Nothing'],
    picture: false,
    cadence: 'daily',
    sortKey: 350,
  },
  {
    taskId: 'task_0000002',
    textShort: 'Leave a kind note for a family member or roommate!',
    textLong:
      'Write a short, uplifting note for someone you live with—whether it is a parent, sibling, or roommate—and leave it somewhere they will find it, like on their pillow, desk, or mirror. It could be a compliment, a thank-you, or just a reminder that you care about them. Even a few kind words can make someone’s day feel a little lighter.',
    active: true,
    category: 'general',
    difficulty: 1,
    minAge: 1,
    maxAge: 999,
    traits: ['Any'],
    materials: ['Pencil/Pen', 'Sticky note'],
    picture: true,
    cadence: 'daily',
    sortKey: 349,
  },
  {
    taskId: 'task_0000003',
    textShort: 'Compliment a stranger (genuinely and respectfully)!',
    textLong:
      'The next time you are out—at school, work, or even in line at a store—take a moment to give someone a sincere compliment. It could be about their outfit, smile, energy, or something kind they did. A genuine compliment can completely shift someone’s mood and remind them they are seen and appreciated.',
    active: true,
    category: 'general',
    difficulty: 2,
    minAge: 1,
    maxAge: 999,
    traits: ['Extrovert'],
    materials: ['Nothing'],
    picture: false,
    cadence: 'daily',
    sortKey: 348,
  },
  {
    taskId: 'task_0000004',
    textShort: 'Pick up a few pieces of litter you see on the ground.',
    textLong:
      'Next time you are walking outside—whether it is around your neighborhood, a park, or a school campus—take a moment to pick up a few pieces of trash you notice on the ground. It is a small action that helps the environment, shows care for your community, and might even inspire others to do the same.',
    active: true,
    category: 'environmental',
    difficulty: 2,
    minAge: 1,
    maxAge: 999,
    traits: ['Environmentalist'],
    materials: ['Nothing'],
    picture: true,
    cadence: 'daily',
    sortKey: 347,
  },
  {
    taskId: 'task_0000005',
    textShort: 'Hold the door open for someone.',
    textLong:
      'When you see someone approaching a door, pause and hold it open for them. It is a tiny gesture, but it can make someone feel respected and acknowledged—especially if their hands are full or they are in a rush.',
    active: true,
    category: 'general',
    difficulty: 1,
    minAge: 1,
    maxAge: 999,
    traits: ['Any'],
    materials: ['Nothing'],
    picture: false,
    cadence: 'daily',
    sortKey: 346,
  },
  {
    taskId: 'task_0000006',
    textShort: 'Help a sibling with homework',
    textLong:
      'Offer to help a sibling or family member with their homework. Even if it is just sitting nearby or encouraging them, showing that you are there can make a big difference.',
    active: true,
    category: 'general',
    difficulty: 2,
    minAge: 6,
    maxAge: 999,
    traits: ['Any'],
    materials: ['Nothing'],
    picture: false,
    cadence: 'weekly',
    sortKey: 260,
  },
  {
    taskId: 'task_0000007',
    textShort: 'Make breakfast or lunch for your family',
    textLong:
      'Surprise your family by making breakfast or lunch for everyone. It does not need to be fancy — even a simple meal shows care and can brighten someone’s day.',
    active: true,
    category: 'general',
    difficulty: 1,
    minAge: 6,
    maxAge: 999,
    traits: ['Any'],
    materials: ['Food', 'Utensils'],
    picture: true,
    cadence: 'weekly',
    sortKey: 259,
  },
  {
    taskId: 'task_0000008',
    textShort: 'Do a grocery run for your parents',
    textLong:
      'Ask your parents if there is anything you can grab for them during the week, and take initiative to help with a grocery run. It could be picking up a few items or helping carry in bags.',
    active: true,
    category: 'general',
    difficulty: 2,
    minAge: 16,
    maxAge: 30,
    traits: ['Any'],
    materials: ['Nothing'],
    picture: true,
    cadence: 'weekly',
    sortKey: 258,
  },
  {
    taskId: 'task_0000009',
    textShort: 'Help someone load groceries into their car',
    textLong:
      'The next time you are in a parking lot or store, be on the lookout for someone who might need help loading their groceries into their car. Offer a quick, polite hand if the moment feels right.',
    active: true,
    category: 'community',
    difficulty: 1,
    minAge: 8,
    maxAge: 999,
    traits: ['Any'],
    materials: ['Nothing'],
    picture: false,
    cadence: 'weekly',
    sortKey: 257,
  },
  {
    taskId: 'task_0000010',
    textShort: 'Reach out to someone who looks down or lonely',
    textLong:
      'Take a moment this week to check in with someone who seems down, quiet, or alone. Whether it is a kind message, a short chat, or just sitting with them, your care could mean a lot.',
    active: true,
    category: 'emotional',
    difficulty: 2,
    minAge: 8,
    maxAge: 999,
    traits: ['Any'],
    materials: ['Nothing'],
    picture: false,
    cadence: 'weekly',
    sortKey: 256,
  },
  {
    taskId: 'task_0000011',
    textShort: 'Write a letter to someone you appreciate.',
    textLong:
      'Write a heartfelt letter to someone you appreciate. Tell them how they have impacted you or why you are thankful for them. It is a powerful way to encourage and connect.',
    active: true,
    category: 'emotional',
    difficulty: 2,
    minAge: 8,
    maxAge: 999,
    traits: ['Any'],
    materials: ['Paper', 'Pen'],
    picture: false,
    cadence: 'monthly',
    sortKey: 160,
  },
  {
    taskId: 'task_0000012',
    textShort: 'Donate unused clothes or items.',
    textLong:
      'Go through your closet and donate clothes or items you no longer use. Choose things in good condition that could benefit someone else.',
    active: true,
    category: 'environmental',
    difficulty: 2,
    minAge: 8,
    maxAge: 999,
    traits: ['Any'],
    materials: ['Bag', 'Items to donate'],
    picture: true,
    cadence: 'monthly',
    sortKey: 159,
  },
  {
    taskId: 'task_0000013',
    textShort: 'Do a kind act for a stranger.',
    textLong:
      'Do a random act of kindness for a stranger — pay for someone behind you in line, leave a kind note on a car, or give out a compliment that could make someone’s day.',
    active: true,
    category: 'community',
    difficulty: 2,
    minAge: 10,
    maxAge: 999,
    traits: ['Extrovert'],
    materials: ['Optional: Note', 'Gift'],
    picture: true,
    cadence: 'monthly',
    sortKey: 158,
  },
  {
    taskId: 'task_0000015',
    textShort: 'Create something and give it away.',
    textLong:
      'Make something by hand (art, food, a craft) and give it away with no expectation of anything in return. Use your creativity to serve others.',
    active: true,
    category: 'general',
    difficulty: 2,
    minAge: 8,
    maxAge: 999,
    traits: ['Artsy', 'Craftsy', 'Origami-maker', 'Chef'],
    materials: ['Art supplies', 'Ingredients'],
    picture: true,
    cadence: 'monthly',
    sortKey: 157,
  },
  {
    taskId: 'task_0000016',
    textShort: 'Help someone move or tackle a big task.',
    textLong:
      'Help someone move, carry large items, or do a big task they have been putting off. Offer your time and energy when a need like this comes up.',
    active: true,
    category: 'general',
    difficulty: 3,
    minAge: 10,
    maxAge: 999,
    traits: ['Athletic', 'Extrovert'],
    materials: ['Nothing'],
    picture: true,
    cadence: 'monthly',
    sortKey: 156,
  },
];

/** Target picks per cadence (daily / weekly / monthly) before cross-cadence fill (see `MIN_HOME_ROSTER_CATALOG`). */
export const AUTO_ASSIGN_PER_CADENCE = 3;

/** Home roster size when the catalog has enough unique rows (3 + 3 + 3). */
export const MIN_HOME_ROSTER_CATALOG = 9;

const AUTO_ASSIGN_CADENCES = ['daily', 'weekly', 'monthly'] as const;

function stableOffset(seed: string, modulo: number): number {
  if (modulo <= 0) {
    return 0;
  }
  let h = 0;
  for (let i = 0; i < seed.length; i += 1) {
    h = (Math.imul(31, h) + seed.charCodeAt(i)) | 0;
  }
  return Math.abs(h) % modulo;
}

/**
 * Picks `AUTO_ASSIGN_PER_CADENCE` tasks per cadence (rotates with the calendar period), then **fills** with more
 * catalog acts (highest `sortKey` first) until `MIN_HOME_ROSTER_CATALOG` (nine: three daily, three weekly, three monthly)
 * when a cadence pool is short.
 */
export function sliceAutoAssignableFromCatalog(entries: readonly TaskCatalogEntry[], now: Date = new Date()): TaskCatalogEntry[] {
  const dailyKey = periodKeyForDate('daily', now) ?? '';
  const weeklyKey = periodKeyForDate('weekly', now) ?? '';
  const monthlyKey = periodKeyForDate('monthly', now) ?? '';

  const out: TaskCatalogEntry[] = [];
  for (const cadence of AUTO_ASSIGN_CADENCES) {
    const pool = entries
      .filter((t) => t.cadence === cadence)
      .sort((a, b) => b.sortKey - a.sortKey);
    if (pool.length === 0) {
      continue;
    }

    const periodKey = cadence === 'daily' ? dailyKey : cadence === 'weekly' ? weeklyKey : monthlyKey;
    const n = Math.min(AUTO_ASSIGN_PER_CADENCE, pool.length);
    if (pool.length <= n) {
      out.push(...pool.slice(0, n));
      continue;
    }
    const start = stableOffset(`${cadence}:${periodKey}`, pool.length);
    for (let i = 0; i < n; i += 1) {
      out.push(pool[(start + i) % pool.length]!);
    }
  }

  const seen = new Set(out.map((t) => t.taskId));
  if (out.length >= MIN_HOME_ROSTER_CATALOG) {
    return out;
  }
  const rest = [...entries]
    .filter((t) => !seen.has(t.taskId))
    .sort((a, b) => b.sortKey - a.sortKey);
  for (const t of rest) {
    if (out.length >= MIN_HOME_ROSTER_CATALOG) {
      break;
    }
    out.push(t);
    seen.add(t.taskId);
  }
  return out;
}

/** Legacy packs to remove when syncing the catalog. */
export const LEGACY_TASK_DOC_IDS: readonly string[] = [
  'starter-check-in',
  'starter-door',
  'starter-local-love',
  'starter-litter',
  'starter-donate',
  'assign-daily-1',
  'assign-daily-2',
  'assign-daily-3',
  'assign-weekly-1',
  'assign-weekly-2',
  'assign-weekly-3',
  'assign-monthly-1',
  'assign-monthly-2',
  'assign-monthly-3',
];
