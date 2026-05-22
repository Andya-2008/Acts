/**
 * One-off helper: bias task-catalog-seed.json toward picture-oriented acts.
 * Run: node scripts/patch-picture-catalog.mjs
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const SEED_PATH = join(dirname(fileURLToPath(import.meta.url)), 'task-catalog-seed.json');

const FLIP_TO_PICTURE = new Set([
  'task_0000017',
  'task_0000022',
  'task_0000027',
  'task_0000030',
  'task_0000040',
  'task_0000041',
  'task_0000042',
  'task_0000049',
  'task_0000053',
  'task_0000054',
]);

const PHOTO_LINE =
  ' When you are done, snap a memory photo in Acts (your face or theirs only with permission).';

const NEW_ENTRIES = [
  {
    taskId: 'task_0000055',
    cadence: 'daily',
    textShort: 'Tidy a shared space—and capture the before and after.',
    textLong:
      'Pick one messy corner—a entryway table, shared bathroom counter, or club shelf—and spend ten minutes making it better for everyone. Take a quick before photo, then an after photo in Acts so you can see the difference you made.',
    active: true,
    category: 'general',
    difficulty: 2,
    minAge: 8,
    maxAge: 999,
    traits: ['Any'],
    materials: ['Nothing'],
    picture: true,
    sortKey: 324,
  },
  {
    taskId: 'task_0000056',
    cadence: 'daily',
    textShort: 'Make or plate food for someone and photograph it.',
    textLong:
      'Prepare something simple—a snack plate, toast, tea, or part of a meal—and set it out for someone you live with or work beside. Before they dig in, take a warm photo of what you made and save it as your act memory.',
    active: true,
    category: 'general',
    difficulty: 1,
    minAge: 6,
    maxAge: 999,
    traits: ['Chef'],
    materials: ['Food'],
    picture: true,
    sortKey: 323,
  },
  {
    taskId: 'task_0000057',
    cadence: 'daily',
    textShort: 'Photograph a small kindness you noticed today.',
    textLong:
      'Look for a quiet good deed—a person helping someone, a thoughtful note, a cleaned-up spot. Take a photo that tells the story without embarrassing anyone (avoid close-ups of strangers’ faces unless they are fine with it).',
    active: true,
    category: 'community',
    difficulty: 1,
    minAge: 10,
    maxAge: 999,
    traits: ['Any'],
    materials: ['Phone'],
    picture: true,
    sortKey: 322,
  },
  {
    taskId: 'task_0000058',
    cadence: 'weekly',
    textShort: 'Write sidewalk chalk encouragement and photograph it.',
    textLong:
      'Use chalk to leave a short uplifting message on a sidewalk or driveway where it is allowed—something hopeful and kind. Photograph your message so you remember the words you shared with the neighborhood.',
    active: true,
    category: 'community',
    difficulty: 1,
    minAge: 8,
    maxAge: 999,
    traits: ['Artsy'],
    materials: ['Sidewalk chalk'],
    picture: true,
    sortKey: 245,
  },
  {
    taskId: 'task_0000059',
    cadence: 'weekly',
    textShort: 'Lay out a care package, then deliver it.',
    textLong:
      'Arrange a small care package on a table—snacks, a note, socks, tea—and photograph the flat lay. Then deliver it to someone having a hard week and save the photo as proof of your thoughtfulness.',
    active: true,
    category: 'emotional',
    difficulty: 2,
    minAge: 10,
    maxAge: 999,
    traits: ['Any'],
    materials: ['Bag', 'Assorted items'],
    picture: true,
    sortKey: 244,
  },
  {
    taskId: 'task_0000060',
    cadence: 'weekly',
    textShort: 'Take a “study buddy” photo while you help someone learn.',
    textLong:
      'Spend time helping someone with homework or a skill. Take a respectful photo of your notes, whiteboard, or workspace together (ask if they are comfortable being in frame).',
    active: true,
    category: 'community',
    difficulty: 2,
    minAge: 12,
    maxAge: 999,
    traits: ['Any'],
    materials: ['Notes'],
    picture: true,
    sortKey: 243,
  },
  {
    taskId: 'task_0000062',
    cadence: 'monthly',
    textShort: 'Handwrite a card, photograph it, then mail or deliver it.',
    textLong:
      'Write a thank-you or encouragement card by hand. Before you seal the envelope, photograph the card (cover any private addresses). Deliver or mail it to someone who needs to feel seen.',
    active: true,
    category: 'emotional',
    difficulty: 2,
    minAge: 8,
    maxAge: 999,
    traits: ['Any'],
    materials: ['Card', 'Pen'],
    picture: true,
    sortKey: 147,
  },
];

const BASE_CATALOG = [
  {
    taskId: 'task_0000001',
    cadence: 'daily',
    textShort: 'Thank one of your closest friends over text!',
    textLong:
      'Take a moment to reflect on one of your closest friends—the person who has been there for you through thick and thin. Now, send them a thoughtful text message expressing your gratitude. Let them know how much their friendship means to you, recall a specific memory or moment you appreciated, and tell them the impact they have had on your life. A simple, heartfelt message can brighten their day and strengthen your bond. Optional: save a screenshot or photo that reminds you of them as your act memory.',
    active: true,
    category: 'general',
    difficulty: 1,
    minAge: 1,
    maxAge: 999,
    traits: ['Any'],
    materials: ['Nothing'],
    picture: true,
    sortKey: 350,
  },
  {
    taskId: 'task_0000006',
    cadence: 'weekly',
    textShort: 'Help a sibling with homework',
    textLong:
      'Offer to help a sibling or family member with their homework. Even if it is just sitting nearby or encouraging them, showing that you are there can make a big difference. Snap a photo of your notes or workspace together (with their okay).',
    active: true,
    category: 'general',
    difficulty: 2,
    minAge: 6,
    maxAge: 999,
    traits: ['Any'],
    materials: ['Nothing'],
    picture: true,
    sortKey: 260,
  },
  {
    taskId: 'task_0000009',
    cadence: 'weekly',
    textShort: 'Help someone load groceries into their car',
    textLong:
      'The next time you are in a parking lot or store, be on the lookout for someone who might need help loading their groceries into their car. Offer a quick, polite hand if the moment feels right. A quick photo of the loaded bags or your wave goodbye works as a memory.',
    active: true,
    category: 'community',
    difficulty: 1,
    minAge: 8,
    maxAge: 999,
    traits: ['Any'],
    materials: ['Nothing'],
    picture: true,
    sortKey: 257,
  },
  {
    taskId: 'task_0000011',
    cadence: 'monthly',
    textShort: 'Write a letter to someone you appreciate.',
    textLong:
      'Write a heartfelt letter to someone you appreciate. Tell them how they have impacted you or why you are thankful for them. Photograph the letter or envelope before you send it—it is a powerful way to encourage and connect.',
    active: true,
    category: 'emotional',
    difficulty: 2,
    minAge: 8,
    maxAge: 999,
    traits: ['Any'],
    materials: ['Paper', 'Pen'],
    picture: true,
    sortKey: 160,
  },
];

const raw = readFileSync(SEED_PATH, 'utf8');
const entries = JSON.parse(raw);
const byId = new Map(entries.map((e) => [e.taskId, e]));

for (const e of BASE_CATALOG) {
  byId.set(e.taskId, { ...byId.get(e.taskId), ...e });
}

for (const id of FLIP_TO_PICTURE) {
  const e = byId.get(id);
  if (!e) continue;
  e.picture = true;
  if (!e.textLong.toLowerCase().includes('photo') && !e.textLong.toLowerCase().includes('screenshot')) {
    e.textLong = `${e.textLong.trim()}${PHOTO_LINE}`;
  }
}

for (const e of NEW_ENTRIES) {
  byId.set(e.taskId, e);
}

const merged = [...byId.values()].sort((a, b) => b.sortKey - a.sortKey);
writeFileSync(SEED_PATH, `${JSON.stringify(merged, null, 2)}\n`, 'utf8');

const pictureCount = merged.filter((e) => e.picture).length;
console.log(`Updated ${SEED_PATH}: ${merged.length} acts, ${pictureCount} picture-oriented.`);
