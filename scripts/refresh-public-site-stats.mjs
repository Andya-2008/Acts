/**
 * Refreshes public aggregate counts used by the marketing website.
 *
 * Writes: publicStats/siteMetrics
 *
 * Requires either GOOGLE_APPLICATION_CREDENTIALS or Application Default Credentials
 * with Firestore read/write access.
 */
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { applicationDefault, cert, getApps, initializeApp } from 'firebase-admin/app';
import { FieldValue, getFirestore } from 'firebase-admin/firestore';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

function loadDotEnv() {
  const envPath = join(ROOT, '.env');
  if (!existsSync(envPath)) return;
  const text = readFileSync(envPath, 'utf8');
  for (const line of text.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    if (process.env[key] === undefined) process.env[key] = value;
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

async function countCollection(db, collectionName) {
  const snap = await db.collection(collectionName).count().get();
  return snap.data().count;
}

async function countActiveTasks(db) {
  const groups = ['dailyTask', 'weeklyTask', 'monthlyTask'];
  let count = 0;
  for (const group of groups) {
    const snap = await db.collectionGroup(group).get();
    snap.forEach((doc) => {
      if (doc.data().active !== false) count += 1;
    });
  }
  return count;
}

async function main() {
  loadDotEnv();
  const projectId = resolveProjectId();
  if (!projectId) {
    throw new Error('Set FIREBASE_PROJECT_ID or EXPO_PUBLIC_FIREBASE_PROJECT_ID.');
  }

  if (getApps().length === 0) {
    const credPath = process.env.GOOGLE_APPLICATION_CREDENTIALS?.trim();
    initializeApp({
      credential: credPath && existsSync(credPath) ? cert(JSON.parse(readFileSync(credPath, 'utf8'))) : applicationDefault(),
      projectId,
    });
  }

  const db = getFirestore();
  const [activePromptCount, userCount, deedPostCount] = await Promise.all([
    countActiveTasks(db),
    countCollection(db, 'userInfo'),
    countCollection(db, 'deedPosts'),
  ]);

  const payload = {
    activePromptCount,
    userCount,
    deedPostCount,
    updatedAt: FieldValue.serverTimestamp(),
  };

  await db.collection('publicStats').doc('siteMetrics').set(payload, { merge: true });
  console.log(JSON.stringify({ ...payload, updatedAt: 'serverTimestamp()' }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
