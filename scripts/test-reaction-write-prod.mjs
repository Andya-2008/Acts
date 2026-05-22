#!/usr/bin/env node
/** Test reaction create against production rules (not Admin SDK). */
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import admin from 'firebase-admin';
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithCustomToken } from 'firebase/auth';
import { doc, getFirestore, serverTimestamp, setDoc } from 'firebase/firestore';

const ROOT = resolve(import.meta.dirname, '..');
const POST_ID = process.argv[2] || 'gZfm6SDjvaeQ4WX9fN3I';

function loadDotEnv() {
  const path = resolve(ROOT, '.env');
  if (!existsSync(path)) return {};
  const out = {};
  for (const line of readFileSync(path, 'utf8').split(/\r?\n/)) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const i = t.indexOf('=');
    if (i < 1) continue;
    out[t.slice(0, i).trim()] = t.slice(i + 1).trim().replace(/^["']|["']$/g, '');
  }
  return out;
}

const env = loadDotEnv();
const credPath = resolve(ROOT, 'scripts/acts-d7c7f-firebase-adminsdk-fbsvc-4f58f6f5bd.json');
if (!admin.apps.length) {
  admin.initializeApp({ credential: admin.credential.cert(JSON.parse(readFileSync(credPath, 'utf8'))) });
}

const projectId = env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || 'acts-d7c7f';
const testUid = `debug-reaction-${Date.now()}`;
const token = await admin.auth().createCustomToken(testUid);

const app = initializeApp({
  apiKey: env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId,
  storageBucket: env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: env.EXPO_PUBLIC_FIREBASE_APP_ID,
});

const auth = getAuth(app);
await signInWithCustomToken(auth, token);
const db = getFirestore(app);
const ref = doc(db, 'deedPosts', POST_ID, 'reactions', testUid);

console.log('projectId', projectId);
console.log('postId', POST_ID);
console.log('testUid', testUid);

try {
  await setDoc(ref, { reactorUid: testUid, kind: 'heart', createdAt: serverTimestamp() });
  console.log('WRITE_OK');
  await admin.firestore().doc(`deedPosts/${POST_ID}/reactions/${testUid}`).delete();
  console.log('CLEANUP_OK');
} catch (e) {
  console.error('WRITE_FAIL', e?.code, e?.message);
  process.exit(1);
}
