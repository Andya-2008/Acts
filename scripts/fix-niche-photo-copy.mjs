import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const SEED_PATH = join(dirname(fileURLToPath(import.meta.url)), 'task-catalog-seed.json');
const CLOSING =
  "When you are done, take a picture together afterward and save it as your act memory (faces only with everyone's permission).";

const NICHE = new Set(
  Array.from({ length: 22 }, (_, i) => `task_${String(65 + i).padStart(7, '0')}`),
);

const entries = JSON.parse(readFileSync(SEED_PATH, 'utf8'));
for (const e of entries) {
  if (!NICHE.has(e.taskId) || !e.textLong.includes(CLOSING)) continue;
  let body = e.textLong.slice(0, e.textLong.indexOf(CLOSING)).trim();
  const parts = body.split(/(?<=[.!?])\s+/).filter(Boolean);
  const kept = parts.filter((s) => !/take a picture together afterward/i.test(s));
  body = kept.length ? kept.join(' ') : body;
  e.textLong = `${body} ${CLOSING}`;
}
writeFileSync(SEED_PATH, `${JSON.stringify(entries, null, 2)}\n`, 'utf8');
console.log('Normalized niche act photo copy.');
