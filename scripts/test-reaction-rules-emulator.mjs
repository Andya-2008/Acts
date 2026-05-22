/**
 * Validates deed reaction create/update against firestore.rules via the emulator.
 * Run: npx firebase emulators:exec --only firestore "node scripts/test-reaction-rules-emulator.mjs"
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { initializeApp } from 'firebase/app';
import {
  connectFirestoreEmulator,
  doc,
  getFirestore,
  serverTimestamp,
  setDoc,
  deleteDoc,
  updateDoc,
  getDoc,
} from 'firebase/firestore';
import { getAuth, connectAuthEmulator, signInAnonymously } from 'firebase/auth';

const PROJECT = 'acts-d7c7f';
const VIEWER = 'viewer-test-uid';
const POST_ID = 'post-test-1';

const app = initializeApp({
  apiKey: 'fake',
  authDomain: `${PROJECT}.firebaseapp.com`,
  projectId: PROJECT,
});
const auth = getAuth(app);
connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
const db = getFirestore(app);
connectFirestoreEmulator(db, '127.0.0.1', 8080);

async function seedPost() {
  const { initializeApp: initAdmin, cert, getApps } = await import('firebase-admin/app');
  const { getFirestore: adminDb } = await import('firebase-admin/firestore');
  const credPath = resolve('scripts/acts-d7c7f-firebase-adminsdk-fbsvc-4f58f6f5bd.json');
  if (!getApps().length) {
    initAdmin({
      credential: cert(JSON.parse(readFileSync(credPath, 'utf8'))),
      projectId: PROJECT,
    });
  }
  const admin = adminDb();
  await admin.doc(`deedPosts/${POST_ID}`).set(
    {
      authorUid: 'author-other',
      authorDisplayName: 'Author',
      authorProfilePicUrl: 'https://example.com/a.png',
      photoUrl: 'https://example.com/photo.jpg',
      caption: 'Test',
      feedReactionsEnabled: true,
      createdAt: new Date(),
    },
    { merge: true },
  );
}

async function run() {
  await signInAnonymously(auth);
  const uid = auth.currentUser.uid;
  const ref = doc(db, 'deedPosts', POST_ID, 'reactions', uid);

  const create = async () => {
    await setDoc(ref, { reactorUid: uid, kind: 'heart', createdAt: serverTimestamp() });
  };
  const updateKind = async () => {
    await updateDoc(ref, { kind: 'clap' });
  };
  const deleteThenCreate = async () => {
    await deleteDoc(ref);
    await setDoc(ref, { reactorUid: uid, kind: 'star', createdAt: serverTimestamp() });
  };

  const steps = [
    ['create', create],
    ['updateKind', updateKind],
    ['deleteThenCreate', deleteThenCreate],
  ];

  for (const [name, fn] of steps) {
    try {
      await fn();
      console.log('OK', name);
    } catch (e) {
      console.error('FAIL', name, e.code ?? e.message);
      process.exitCode = 1;
    }
  }
  const snap = await getDoc(ref);
  console.log('final', snap.exists(), snap.data());
}

await seedPost().catch(() => {
  console.warn('seed skipped (admin may not run in emulator-only mode)');
});
await run();
