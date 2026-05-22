/**
 * Set active:false on task IDs (catalog review drops).
 * Usage: node scripts/deactivate-task-ids.mjs task_0000020 task_0000047
 * Or:    node scripts/deactivate-task-ids.mjs --file scripts/catalog-drops.txt
 *   (one taskId per line; lines starting with # are ignored)
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const SEED_PATH = join(dirname(fileURLToPath(import.meta.url)), 'task-catalog-seed.json');
const root = dirname(fileURLToPath(import.meta.url));

function idsFromArgs(argv) {
  const fileIdx = argv.indexOf('--file');
  if (fileIdx !== -1) {
    const p = argv[fileIdx + 1];
    if (!p) {
      throw new Error('--file requires a path');
    }
    const text = readFileSync(join(root, p), 'utf8');
    return text
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter((l) => l.length > 0 && !l.startsWith('#'));
  }
  return argv.filter((a) => a.startsWith('task_'));
}

const ids = new Set(idsFromArgs(process.argv.slice(2)));
if (ids.size === 0) {
  console.error('No task IDs. Pass task_00000XX … or --file catalog-drops.txt');
  process.exit(1);
}

const entries = JSON.parse(readFileSync(SEED_PATH, 'utf8'));
let n = 0;
for (const e of entries) {
  if (ids.has(e.taskId)) {
    e.active = false;
    n++;
  }
}
writeFileSync(SEED_PATH, `${JSON.stringify(entries, null, 2)}\n`, 'utf8');
console.log(`Set active:false on ${n} act(s): ${[...ids].join(', ')}`);
