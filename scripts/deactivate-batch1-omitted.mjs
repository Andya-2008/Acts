/**
 * Deactivates batch-1 niche acts the user chose to omit (keeps 1, 2, 3, 8 only).
 * Run: node scripts/deactivate-batch1-omitted.mjs
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const SEED_PATH = join(dirname(fileURLToPath(import.meta.url)), 'task-catalog-seed.json');

/** Batch 1 numbers 4–7, 9–22 → omit from catalog */
export const OMITTED_NICHE_TASK_IDS = [
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

const OMIT = new Set(OMITTED_NICHE_TASK_IDS);
const entries = JSON.parse(readFileSync(SEED_PATH, 'utf8'));
let n = 0;
for (const e of entries) {
  if (OMIT.has(e.taskId)) {
    e.active = false;
    n++;
  }
}
writeFileSync(SEED_PATH, `${JSON.stringify(entries, null, 2)}\n`, 'utf8');
console.log(`Set active:false on ${n} omitted niche acts. Kept: task_0000065, 0066, 0067, 0072.`);
