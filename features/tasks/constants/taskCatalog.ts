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
      'Take a moment to reflect on one of your closest friends-the person who has been there for you through thick and thin. Now, send them a thoughtful text message expressing your gratitude. Let them know how much their friendship means to you, recall a specific memory or moment you appreciated, and tell them the impact they have had on your life. A simple, heartfelt message can brighten their day and strengthen your bond.',
    active: true,
    category: 'general',
    difficulty: 1,
    minAge: 1,
    maxAge: 999,
    traits: ['Any'],
    materials: ['Nothing'],
    picture: true,
    cadence: 'daily',
    sortKey: 350,
  },
  {
    taskId: 'task_0000002',
    textShort: 'Leave a kind note for a family member or roommate!',
    textLong:
      'Write a short, uplifting note for someone you live with-whether it is a parent, sibling, or roommate-and leave it somewhere they will find it, like on their pillow, desk, or mirror. It could be a compliment, a thank-you, or just a reminder that you care about them. Even a few kind words can make someone’s day feel a little lighter.',
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
    textShort: 'Compliment a friend (genuinely and specifically)!',
    textLong:
      'Think of a friend you have not hyped up lately. Send them or tell them one sincere, specific compliment-in person, on a call, or in a message. It could be about their effort, humor, loyalty, or something kind they did. When you are done, take a picture together afterward if you are in person, or save a screenshot of your message as your act memory.',
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
      'Next time you are walking outside-whether it is around your neighborhood, a park, or a school campus-take a moment to pick up a few pieces of trash you notice on the ground. It is a small action that helps the environment, shows care for your community, and might even inspire others to do the same.',
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
      'When you see someone approaching a door, pause and hold it open for them. It is a tiny gesture, but it can make someone feel respected and acknowledged-especially if their hands are full or they are in a rush.',
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
    picture: true,
    cadence: 'weekly',
    sortKey: 260,
  },
  {
    taskId: 'task_0000007',
    textShort: 'Make breakfast or lunch for your family',
    textLong:
      'Surprise your family by making breakfast or lunch for everyone. It does not need to be fancy - even a simple meal shows care and can brighten someone’s day.',
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
    picture: true,
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
    picture: true,
    cadence: 'monthly',
    sortKey: 160,
  },
  {
    taskId: 'task_0000013',
    textShort: 'Do a kind act for a friend.',
    textLong:
      'Do something kind for a friend without them asking-bring them a snack, cover a small favor, send a care note, or help with one task they have been putting off. When you are done, take a picture together afterward if you see them, or save proof of the act as your memory.',
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

/** Target picks per cadence (daily / weekly / monthly) before cross-cadence fill (see `sliceAutoAssignableFromCatalog`). */
export const AUTO_ASSIGN_PER_CADENCE = 3;

/** When possible, this fraction of each cadence roster favors acts with `picture: true`. */
export const PICTURE_ROSTER_RATIO = 2 / 3;

/** Default home roster size when using three picks per cadence (3 + 3 + 3). */
export const MIN_HOME_ROSTER_CATALOG = 9;

const AUTO_ASSIGN_CADENCES = ['daily', 'weekly', 'monthly'] as const;

export type AutoAssignPerCadenceCounts = {
  daily: number;
  weekly: number;
  monthly: number;
};

const DEFAULT_PER_CADENCE: AutoAssignPerCadenceCounts = {
  daily: AUTO_ASSIGN_PER_CADENCE,
  weekly: AUTO_ASSIGN_PER_CADENCE,
  monthly: AUTO_ASSIGN_PER_CADENCE,
};

function rosterTargetSize(per: AutoAssignPerCadenceCounts): number {
  return Math.max(1, per.daily + per.weekly + per.monthly);
}

export type SliceCatalogOptions = {
  /** Prefer acts at this difficulty (1 easy … 3 hard) when building the rotating roster. */
  preferredDifficultyLevel?: 1 | 2 | 3 | null;
  /** When set, roster picks are shuffled per user + period (different users, different acts). */
  uid?: string;
};

function sortPoolByPreferenceThenSortKey(pool: TaskCatalogEntry[], pref?: 1 | 2 | 3 | null): TaskCatalogEntry[] {
  return [...pool].sort((a, b) => {
    if (pref != null && pref >= 1 && pref <= 3) {
      const ap = a.difficulty === pref ? 1 : 0;
      const bp = b.difficulty === pref ? 1 : 0;
      if (ap !== bp) {
        return bp - ap;
      }
    }
    return b.sortKey - a.sortKey;
  });
}

function hashSeed(seed: string): number {
  let h = 0;
  for (let i = 0; i < seed.length; i += 1) {
    h = (Math.imul(31, h) + seed.charCodeAt(i)) | 0;
  }
  return h >>> 0;
}

function mulberry32(a: number): number {
  let t = (a += 0x6d2b79f5);
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

/** Deterministic shuffle: same uid + cadence + period → same picks; different users → different order. */
export function seededShuffleCatalog<T>(items: readonly T[], seed: string): T[] {
  const arr = [...items];
  let state = hashSeed(seed) || 1;
  for (let i = arr.length - 1; i > 0; i -= 1) {
    state = Math.floor(mulberry32(state) * 4294967296);
    const j = state % (i + 1);
    const tmp = arr[i]!;
    arr[i] = arr[j]!;
    arr[j] = tmp;
  }
  return arr;
}

/**
 * Random catalog picks for one cadence (per-user seeded shuffle, then take first `cap`).
 */
export function pickCatalogForCadence(
  entries: readonly TaskCatalogEntry[],
  cadence: (typeof AUTO_ASSIGN_CADENCES)[number],
  now: Date,
  cap: number,
  options?: SliceCatalogOptions,
): TaskCatalogEntry[] {
  const pool = sortPoolByPreferenceThenSortKey(
    entries.filter((t) => t.cadence === cadence),
    options?.preferredDifficultyLevel ?? null,
  );
  const n = Math.min(Math.max(0, cap), pool.length);
  if (n === 0) {
    return [];
  }
  if (pool.length <= n) {
    return pool.slice(0, n);
  }
  const periodKey = periodKeyForDate(cadence, now) ?? '';
  const uid = options?.uid?.trim() ?? '';
  const seed = uid ? `${uid}:${cadence}:${periodKey}` : `${cadence}:${periodKey}`;

  const picturePool = pool.filter((t) => t.picture);
  const otherPool = pool.filter((t) => !t.picture);
  const targetPicture = Math.min(
    picturePool.length,
    Math.max(picturePool.length > 0 ? 1 : 0, Math.ceil(n * PICTURE_ROSTER_RATIO)),
  );
  const picked = [...seededShuffleCatalog(picturePool, `${seed}:pic`).slice(0, targetPicture)];
  const need = n - picked.length;
  if (need > 0) {
    const restPool = [
      ...seededShuffleCatalog(otherPool, `${seed}:other`),
      ...seededShuffleCatalog(picturePool, `${seed}:picRest`).slice(targetPicture),
    ];
    picked.push(...restPool.slice(0, need));
  }
  return picked;
}

/**
 * Picks up to `perCadence.{daily|weekly|monthly}` tasks per cadence (rotates with the calendar period), then **fills**
 * with more catalog acts (highest `sortKey` first) until the roster reaches `daily+weekly+monthly` when pools are short.
 */
export function sliceAutoAssignableFromCatalog(
  entries: readonly TaskCatalogEntry[],
  now: Date = new Date(),
  perCadence: AutoAssignPerCadenceCounts = DEFAULT_PER_CADENCE,
  options?: SliceCatalogOptions,
): TaskCatalogEntry[] {
  const targetRoster = rosterTargetSize(perCadence);

  const out: TaskCatalogEntry[] = [];
  for (const cadence of AUTO_ASSIGN_CADENCES) {
    const cap = cadence === 'daily' ? perCadence.daily : cadence === 'weekly' ? perCadence.weekly : perCadence.monthly;
    out.push(...pickCatalogForCadence(entries, cadence, now, cap, options));
  }

  const seen = new Set(out.map((t) => t.taskId));
  if (out.length >= targetRoster) {
    return out;
  }
  const pref = options?.preferredDifficultyLevel ?? null;
  const rest = sortPoolByPreferenceThenSortKey(
    [...entries].filter((t) => !seen.has(t.taskId)),
    pref,
  );
  const uid = options?.uid?.trim() ?? '';
  const fillSeed = uid ? `${uid}:fill:${periodKeyForDate('daily', now)}` : `fill:${periodKeyForDate('daily', now)}`;
  for (const t of seededShuffleCatalog(rest, fillSeed ?? 'fill')) {
    if (out.length >= targetRoster) {
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
