/**
 * Removes passive / charity / volunteer acts from task-catalog-seed.json.
 * Run: node scripts/prune-task-catalog.mjs
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const SEED_PATH = join(dirname(fileURLToPath(import.meta.url)), 'task-catalog-seed.json');

/** Dropped from catalog — seed upload sets active: false so Firestore stops assigning them. */
export const DEACTIVATED_TASK_IDS = [
  'task_0000012', // donate clothes (legacy catalog doc)
  'task_0000014', // volunteer hours
  'task_0000035', // donation drive
  'task_0000037', // sponsor / donate to cause
  'task_0000040', // document & celebrate (no action)
  'task_0000049', // amplify fundraiser
  'task_0000057', // photograph others' kindness (observe only)
  'task_0000061', // volunteer shift photo
  // batch-1 review: kept only Wordle, GeoGuessr, RPS, pantry cook-off
  'task_0000068',
  'task_0000069',
  'task_0000070',
  'task_0000071',
  'task_0000073',
  'task_0000074',
  'task_0000075',
  'task_0000076',
  'task_0000077',
  'task_0000078',
  'task_0000079',
  'task_0000080',
  'task_0000081',
  'task_0000082',
  'task_0000083',
  'task_0000084',
  'task_0000085',
  'task_0000086',
];

const DROP = new Set(DEACTIVATED_TASK_IDS);

function shouldDrop(entry) {
  if (DROP.has(entry.taskId)) return true;
  const blob = `${entry.textShort} ${entry.textLong}`.toLowerCase();
  if (/\bvolunteer\b/.test(blob)) return true;
  if (/\bdonation\b|\bdonate\b|\bcharity\b|\bshelter\b|\bfood pantry\b|\bfundrais/.test(blob)) {
    return true;
  }
  if (/\bdocument and celebrate\b|\bwrite down three kind\b|\bwitnessed this month\b/.test(blob)) {
    return true;
  }
  if (/photograph a small kindness you noticed|kindness you noticed today/.test(blob)) {
    return true;
  }
  return false;
}

const raw = readFileSync(SEED_PATH, 'utf8');
const entries = JSON.parse(raw);
const kept = entries.filter((e) => !shouldDrop(e));

const deactivatedStubs = DEACTIVATED_TASK_IDS.filter((id) => !kept.some((e) => e.taskId === id)).map(
  (taskId) => {
    const prev = entries.find((e) => e.taskId === taskId);
    return {
      ...(prev ?? { taskId, cadence: 'monthly', textShort: '(removed)', textLong: '', sortKey: 0 }),
      active: false,
      textShort: prev?.textShort ?? '(removed)',
    };
  },
);

const out = [...kept, ...deactivatedStubs].sort((a, b) => b.sortKey - a.sortKey);
writeFileSync(SEED_PATH, `${JSON.stringify(out, null, 2)}\n`, 'utf8');

console.log(`Kept ${kept.length} active acts, ${deactivatedStubs.length} marked active:false.`);
