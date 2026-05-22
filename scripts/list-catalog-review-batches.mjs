/**
 * Prints catalog review batches (same grouping as the 4-batch act review).
 * Run: node scripts/list-catalog-review-batches.mjs [batch]
 *   batch: 1 | 2 | 3 | 4 | all  (default all)
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const SEED_PATH = join(dirname(fileURLToPath(import.meta.url)), 'task-catalog-seed.json');

/** Batch 1 niche social (user kept 65, 66, 67, 72 only). */
const BATCH1_FUN_SOCIAL = new Set([
  'task_0000065',
  'task_0000066',
  'task_0000067',
  'task_0000068',
  'task_0000069',
  'task_0000070',
  'task_0000071',
  'task_0000072',
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
]);

const BATCH1_KEPT = new Set(['task_0000065', 'task_0000066', 'task_0000067', 'task_0000072']);

function byId(catalog) {
  return new Map(catalog.map((t) => [t.taskId, t]));
}

function activeTasks(catalog) {
  return catalog.filter((t) => t.active !== false);
}

function printBatch(title, tasks, startNum = 1) {
  console.log(`\n## ${title} (${tasks.length})\n`);
  tasks.forEach((t, i) => {
    const n = startNum + i;
    console.log(`**${n}.** \`${t.taskId}\` · ${t.cadence}`);
    console.log(`**${t.textShort}**\n`);
  });
}

const catalog = JSON.parse(readFileSync(SEED_PATH, 'utf8'));
const active = activeTasks(catalog);
const idMap = byId(catalog);

const batch1 = [...BATCH1_FUN_SOCIAL].map((id) => idMap.get(id)).filter(Boolean);
const batch1Active = batch1.filter((t) => t.active !== false);

const batch2 = active.filter((t) => t.cadence === 'daily' && !BATCH1_FUN_SOCIAL.has(t.taskId));
const batch3 = active.filter((t) => t.cadence === 'weekly' && !BATCH1_FUN_SOCIAL.has(t.taskId));
const batch4 = active.filter((t) => t.cadence === 'monthly');

const arg = (process.argv[2] ?? 'all').toLowerCase();

console.log(`Active acts: ${active.length} (daily ${active.filter((t) => t.cadence === 'daily').length}, weekly ${active.filter((t) => t.cadence === 'weekly').length}, monthly ${batch4.length})`);
console.log(`Batch 1 fun/social: ${batch1.length} total, ${batch1Active.length} still active (kept: ${[...BATCH1_KEPT].join(', ')})`);

if (arg === '1' || arg === 'all') {
  printBatch('Batch 1 — Fun & social (review reference)', batch1.sort((a, b) => (b.sortKey ?? 0) - (a.sortKey ?? 0)), 1);
}
if (arg === '2' || arg === 'all') {
  printBatch('Batch 2 — Daily core (reply keep / drop / edit)', batch2.sort((a, b) => (b.sortKey ?? 0) - (a.sortKey ?? 0)), 23);
}
if (arg === '3' || arg === 'all') {
  printBatch('Batch 3 — Weekly acts', batch3.sort((a, b) => (b.sortKey ?? 0) - (a.sortKey ?? 0)), 46);
}
if (arg === '4' || arg === 'all') {
  printBatch('Batch 4 — Monthly acts', batch4.sort((a, b) => (b.sortKey ?? 0) - (a.sortKey ?? 0)), 46 + batch3.length);
}

if (!['1', '2', '3', '4', 'all'].includes(arg)) {
  console.error('Usage: node scripts/list-catalog-review-batches.mjs [1|2|3|4|all]');
  process.exit(1);
}
