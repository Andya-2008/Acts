/**
 * Uploads act catalog documents to Firestore (Admin SDK bypasses client read-only rules).
 *
 * Usage:
 *   npm run seed:tasks:dry
 *   npm run seed:tasks
 *
 * Requires GOOGLE_APPLICATION_CREDENTIALS pointing at a service account JSON file.
 * Optional: FIREBASE_PROJECT_ID or EXPO_PUBLIC_FIREBASE_PROJECT_ID (else read from .env).
 */
import { readFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const SEED_PATH = join(__dirname, 'task-catalog-seed.json');

const CADENCE_PATHS = {
  daily: ['dailyTask', 'dailyTask'],
  weekly: ['weeklyTask', 'weeklyTask'],
  monthly: ['monthlyTask', 'monthlyTask'],
};

function loadDotEnv() {
  const envPath = join(ROOT, '.env');
  if (!existsSync(envPath)) {
    return;
  }
  const text = readFileSync(envPath, 'utf8');
  for (const line of text.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) {
      continue;
    }
    const eq = trimmed.indexOf('=');
    if (eq === -1) {
      continue;
    }
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

function resolveProjectId() {
  return (
    process.env.FIREBASE_PROJECT_ID?.trim() ||
    process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID?.trim() ||
    process.env.GCLOUD_PROJECT?.trim() ||
    ''
  );
}

function firestorePayload(entry) {
  return {
    taskId: entry.taskId,
    textShort: entry.textShort ?? '',
    textLong: entry.textLong ?? '',
    active: entry.active !== false,
    category: entry.category ?? 'community',
    difficulty: entry.difficulty ?? 2,
    minAge: entry.minAge ?? 0,
    maxAge: entry.maxAge ?? 999,
    traits: entry.traits ?? ['Any'],
    materials: entry.materials ?? ['Nothing'],
    picture: entry.picture === true,
    sortKey: entry.sortKey ?? 0,
  };
}

function docPath(cadence, taskId) {
  const [parent, sub] = CADENCE_PATHS[cadence];
  return `tasks/${parent}/${sub}/${taskId}`;
}

function parseArgs(argv) {
  return {
    dryRun: argv.includes('--dry-run'),
    help: argv.includes('--help') || argv.includes('-h'),
  };
}

async function main() {
  const { dryRun, help } = parseArgs(process.argv.slice(2));
  if (help) {
    console.log(`
Seed Acts global task catalog → Firestore

  npm run seed:tasks:dry   Preview paths (no writes)
  npm run seed:tasks       Upload (merge; safe to re-run)

Environment:
  GOOGLE_APPLICATION_CREDENTIALS  Path to Firebase service account JSON (required for upload)
  FIREBASE_PROJECT_ID             Optional if set in .env as EXPO_PUBLIC_FIREBASE_PROJECT_ID

Service account needs a role with Firestore write access (e.g. Cloud Datastore User).
`);
    process.exit(0);
  }

  loadDotEnv();

  const raw = readFileSync(SEED_PATH, 'utf8');
  const entries = JSON.parse(raw);
  if (!Array.isArray(entries) || entries.length === 0) {
    throw new Error(`No entries in ${SEED_PATH}`);
  }

  const byCadence = { daily: 0, weekly: 0, monthly: 0 };
  const lines = [];

  for (const entry of entries) {
    const { taskId, cadence } = entry;
    if (!taskId || !cadence) {
      throw new Error(`Each entry needs taskId and cadence: ${JSON.stringify(entry)}`);
    }
    if (!CADENCE_PATHS[cadence]) {
      throw new Error(`Invalid cadence "${cadence}" on ${taskId}`);
    }
    if (taskId !== entry.taskId) {
      throw new Error(`taskId field mismatch on ${taskId}`);
    }
    byCadence[cadence] += 1;
    lines.push({ path: docPath(cadence, taskId), data: firestorePayload(entry), cadence, taskId });
  }

  console.log(`Loaded ${entries.length} acts from task-catalog-seed.json`);
  console.log(`  daily: ${byCadence.daily}, weekly: ${byCadence.weekly}, monthly: ${byCadence.monthly}`);

  if (dryRun) {
    console.log('\n[DRY RUN] Would write:\n');
    for (const { path, data } of lines) {
      console.log(`  ${path}`);
      console.log(`    → ${data.textShort.slice(0, 60)}${data.textShort.length > 60 ? '…' : ''}`);
    }
    console.log('\nRun npm run seed:tasks to upload.');
    return;
  }

  const credPath = process.env.GOOGLE_APPLICATION_CREDENTIALS?.trim();
  if (!credPath || !existsSync(credPath)) {
    console.error(
      '\nMissing GOOGLE_APPLICATION_CREDENTIALS.\n' +
        'Download a service account key from Firebase Console → Project settings → Service accounts,\n' +
        'save it outside git (e.g. scripts/acts-firebase-admin.json) and set:\n' +
        '  $env:GOOGLE_APPLICATION_CREDENTIALS="C:\\path\\to\\acts-firebase-admin.json"\n',
    );
    process.exit(1);
  }

  const projectId = resolveProjectId();
  if (!projectId) {
    console.error('\nSet FIREBASE_PROJECT_ID or EXPO_PUBLIC_FIREBASE_PROJECT_ID in .env\n');
    process.exit(1);
  }

  if (getApps().length === 0) {
    initializeApp({
      credential: cert(JSON.parse(readFileSync(credPath, 'utf8'))),
      projectId,
    });
  }

  const db = getFirestore();
  let batch = db.batch();
  let inBatch = 0;
  let committed = 0;

  const flush = async () => {
    if (inBatch === 0) {
      return;
    }
    await batch.commit();
    committed += inBatch;
    batch = db.batch();
    inBatch = 0;
  };

  for (const { path, data, taskId } of lines) {
    const ref = db.doc(path);
    batch.set(ref, data, { merge: true });
    inBatch += 1;
    console.log(`  ✓ queued ${taskId} → ${path}`);
    if (inBatch >= 400) {
      await flush();
    }
  }
  await flush();

  console.log(`\nDone. Wrote ${committed} document(s) to project "${projectId}".`);
  console.log('In the app: open Tasks → pull to refresh → tap "Sync suggested acts" if needed.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
