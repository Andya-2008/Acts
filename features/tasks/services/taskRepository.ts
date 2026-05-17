import {
  addDoc,
  collection,
  doc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  writeBatch,
  type Firestore,
} from 'firebase/firestore';

import { LEGACY_TASK_DOC_IDS, sliceAutoAssignableFromCatalog } from '@/features/tasks/constants/taskCatalog';
import { currentPeriodKey, periodKeyForDate } from '@/features/tasks/utils/taskPeriodKeys';
import { deleteTaskPhotoObject, uploadTaskPhoto } from '@/shared/services/firebase/storageUploads';
import { firestoreCollections } from '@/shared/config/firestore';
import { getFirebaseFirestore } from '@/shared/services/firebase/client';
import type { ActTask, TaskCadence, TaskCatalogEntry, TaskDifficultyLevel } from '@/shared/types/task';

const CADENCES: TaskCadence[] = ['daily', 'weekly', 'monthly', 'anytime'];

/**
 * Global catalog in Firestore: `tasks/{docId}/{subCollectionId}/{taskDocId}`.
 * Parent doc id and subcollection id match (e.g. `dailyTask` / `dailyTask`).
 */
const GLOBAL_TASK_CATALOG_PATHS: { docId: string; subId: string; cadence: TaskCadence }[] = [
  { docId: 'dailyTask', subId: 'dailyTask', cadence: 'daily' },
  { docId: 'weeklyTask', subId: 'weeklyTask', cadence: 'weekly' },
  { docId: 'monthlyTask', subId: 'monthlyTask', cadence: 'monthly' },
];

/** Any catalog act id that participates in daily/weekly/monthly cadence (used for period resets, not only the home slice). */
function catalogCadenceTaskIds(entries: readonly TaskCatalogEntry[]): Set<string> {
  const s = new Set<string>();
  for (const t of entries) {
    if (t.cadence === 'daily' || t.cadence === 'weekly' || t.cadence === 'monthly') {
      s.add(t.taskId);
    }
  }
  return s;
}

function tasksCollection(db: Firestore, uid: string) {
  return collection(db, firestoreCollections.userInfo, uid, 'tasks');
}

function parseCadence(value: unknown): TaskCadence {
  if (typeof value === 'string' && CADENCES.includes(value as TaskCadence)) {
    return value as TaskCadence;
  }
  return 'anytime';
}

function parseDifficulty(value: unknown): TaskDifficultyLevel {
  if (value === 1 || value === 2 || value === 3) {
    return value;
  }
  if (value === 'easy') {
    return 1;
  }
  if (value === 'hard') {
    return 3;
  }
  if (value === 'medium') {
    return 2;
  }
  return 2;
}

function parseStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.map((v) => String(v));
}

function sortKeyFromCatalogDoc(docId: string, data: Record<string, unknown>): number {
  if (typeof data.sortKey === 'number' && !Number.isNaN(data.sortKey)) {
    return data.sortKey;
  }
  const m = /^task_(\d+)$/.exec(docId);
  if (m) {
    return Number.parseInt(m[1], 10);
  }
  return 0;
}

/** One catalog template doc from `tasks/...` (not a user task instance). */
function parseGlobalCatalogDoc(docId: string, data: Record<string, unknown>, cadence: TaskCadence): TaskCatalogEntry | null {
  if (data.active === false) {
    return null;
  }
  const textShort = String(data.textShort ?? data.title ?? '').trim();
  const textLong = String(data.textLong ?? data.text ?? data.description ?? '').trim();
  if (!textShort) {
    return null;
  }
  return {
    taskId: String(data.taskId ?? docId),
    textShort,
    textLong,
    active: data.active !== false,
    category: String(data.category ?? 'general'),
    difficulty: parseDifficulty(data.difficulty),
    minAge: typeof data.minAge === 'number' ? data.minAge : 1,
    maxAge: typeof data.maxAge === 'number' ? data.maxAge : 999,
    traits: parseStringArray(data.traits),
    materials: parseStringArray(data.materials),
    picture: data.picture === true,
    cadence,
    sortKey: sortKeyFromCatalogDoc(docId, data),
  };
}

/** Loads all published catalog acts from the top-level `tasks` collection in Firestore. */
export async function fetchTaskCatalogFromFirestore(): Promise<TaskCatalogEntry[]> {
  const db = getFirebaseFirestore();
  const out: TaskCatalogEntry[] = [];
  for (const { docId, subId, cadence } of GLOBAL_TASK_CATALOG_PATHS) {
    const col = collection(db, firestoreCollections.tasks, docId, subId);
    const snap = await getDocs(col);
    for (const d of snap.docs) {
      const row = parseGlobalCatalogDoc(d.id, d.data(), cadence);
      if (row) {
        out.push(row);
      }
    }
  }
  out.sort((a, b) => b.sortKey - a.sortKey);
  return out;
}

function parseTaskDoc(id: string, data: Record<string, unknown>): ActTask {
  const textShort = String(data.textShort ?? data.title ?? '');
  const textLong = String(data.textLong ?? data.text ?? data.description ?? '');
  return {
    id,
    taskId: String(data.taskId ?? id),
    textShort,
    textLong,
    active: data.active !== false,
    category: String(data.category ?? 'general'),
    difficulty: parseDifficulty(data.difficulty),
    minAge: typeof data.minAge === 'number' ? data.minAge : 1,
    maxAge: typeof data.maxAge === 'number' ? data.maxAge : 999,
    traits: parseStringArray(data.traits),
    materials: parseStringArray(data.materials),
    picture: data.picture === true,
    photoUrl:
      typeof data.photoUrl === 'string' && data.photoUrl.trim().length > 0 ? data.photoUrl.trim() : null,
    deedFeedPostId:
      typeof data.deedFeedPostId === 'string' && data.deedFeedPostId.trim().length > 0
        ? data.deedFeedPostId.trim()
        : null,
    cadence: parseCadence(data.cadence ?? data['length']),
    sortKey: typeof data.sortKey === 'number' ? data.sortKey : 0,
    createdAt: (data.createdAt as ActTask['createdAt']) ?? null,
    completedAt: (data.completedAt as ActTask['completedAt']) ?? null,
  };
}

async function fetchTasksRaw(uid: string): Promise<ActTask[]> {
  const db = getFirebaseFirestore();
  const col = tasksCollection(db, uid);
  const q = query(col, orderBy('sortKey', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => parseTaskDoc(d.id, d.data()));
}

export async function fetchTasksForUser(uid: string): Promise<ActTask[]> {
  const catalog = await fetchTaskCatalogFromFirestore();
  await applyCadenceResetsForUser(uid, catalog);
  return fetchTasksRaw(uid);
}

/**
 * Catalog daily/weekly/monthly acts reset when the calendar period advances.
 * Clears completion and memory photo for a fresh period (Storage best-effort delete).
 */
export async function applyCadenceResetsForUser(uid: string, catalog?: TaskCatalogEntry[]): Promise<void> {
  const cat = catalog ?? (await fetchTaskCatalogFromFirestore());
  const cadenceCatalogIds = catalogCadenceTaskIds(cat);
  const db = getFirebaseFirestore();
  const col = tasksCollection(db, uid);
  const snap = await getDocs(col);
  const now = new Date();
  const resets: { id: string; hadPhoto: boolean }[] = [];

  let batch = writeBatch(db);
  let count = 0;

  const flush = async () => {
    if (count === 0) {
      return;
    }
    await batch.commit();
    batch = writeBatch(db);
    count = 0;
  };

  for (const d of snap.docs) {
    const t = parseTaskDoc(d.id, d.data());
    if (!cadenceCatalogIds.has(t.taskId)) {
      continue;
    }
    if (t.cadence !== 'daily' && t.cadence !== 'weekly' && t.cadence !== 'monthly') {
      continue;
    }
    if (t.completedAt == null) {
      continue;
    }
    const doneKey = periodKeyForDate(t.cadence, t.completedAt.toDate());
    const curKey = currentPeriodKey(t.cadence, now);
    if (!doneKey || !curKey || doneKey === curKey) {
      continue;
    }

    batch.update(doc(col, t.id), { completedAt: null, photoUrl: null, deedFeedPostId: null });
    resets.push({ id: t.id, hadPhoto: Boolean(t.photoUrl) });
    count += 1;
    if (count >= 400) {
      await flush();
    }
  }
  await flush();

  for (const r of resets) {
    if (r.hadPhoto) {
      void deleteTaskPhotoObject(uid, r.id);
    }
  }
}

/** Remove all task photos for this user (Firestore + Storage best-effort). */
export async function clearAllTaskPhotosForUser(uid: string): Promise<void> {
  const catalog = await fetchTaskCatalogFromFirestore();
  await applyCadenceResetsForUser(uid, catalog);
  const tasks = await fetchTasksRaw(uid);
  const db = getFirebaseFirestore();
  const col = tasksCollection(db, uid);
  let batch = writeBatch(db);
  let n = 0;
  const flush = async () => {
    if (n === 0) {
      return;
    }
    await batch.commit();
    batch = writeBatch(db);
    n = 0;
  };
  for (const t of tasks) {
    if (!t.photoUrl) {
      continue;
    }
    batch.update(doc(col, t.id), { photoUrl: null, deedFeedPostId: null });
    n += 1;
    if (n >= 400) {
      await flush();
    }
    void deleteTaskPhotoObject(uid, t.id);
  }
  await flush();
}

/**
 * Ensures legacy starter docs are removed and missing **home-roster** catalog acts exist.
 * Does **not** delete user task docs just because they fall outside the current top slice (that wiped progress).
 * Adds up to nine catalog acts (three per cadence) when absent, then removes **stale** catalog rows that are not in the
 * current period roster only if they were never started (no completion, photo, or deed post).
 */
export async function ensureAssignedTasks(uid: string): Promise<void> {
  const catalog = await fetchTaskCatalogFromFirestore();
  await applyCadenceResetsForUser(uid, catalog);
  const db = getFirebaseFirestore();
  const col = tasksCollection(db, uid);
  const snap = await getDocs(col);
  const existingIds = new Set(snap.docs.map((d) => d.id));

  const batch = writeBatch(db);
  let ops = 0;
  for (const id of LEGACY_TASK_DOC_IDS) {
    if (existingIds.has(id)) {
      batch.delete(doc(col, id));
      ops += 1;
    }
  }

  const assignable = sliceAutoAssignableFromCatalog(catalog);

  for (const t of assignable) {
    if (!existingIds.has(t.taskId)) {
      batch.set(doc(col, t.taskId), {
        taskId: t.taskId,
        textShort: t.textShort,
        textLong: t.textLong,
        active: t.active,
        category: t.category,
        difficulty: t.difficulty,
        minAge: t.minAge,
        maxAge: t.maxAge,
        traits: t.traits,
        materials: t.materials,
        picture: t.picture,
        photoUrl: null,
        deedFeedPostId: null,
        cadence: t.cadence,
        sortKey: t.sortKey,
        createdAt: serverTimestamp(),
        completedAt: null,
      });
      ops += 1;
    }
  }

  const catalogIdSet = new Set(catalog.map((t) => t.taskId));
  const assignableIds = new Set(assignable.map((t) => t.taskId));

  for (const d of snap.docs) {
    const t = parseTaskDoc(d.id, d.data());
    if (!catalogIdSet.has(t.taskId)) {
      continue;
    }
    if (assignableIds.has(t.taskId)) {
      continue;
    }
    if (t.completedAt != null) {
      continue;
    }
    if (t.photoUrl) {
      continue;
    }
    if (t.deedFeedPostId) {
      continue;
    }
    batch.delete(doc(col, d.id));
    ops += 1;
  }

  if (ops === 0) {
    return;
  }
  await batch.commit();
}

export async function setTaskCompleted(uid: string, taskId: string, completed: boolean): Promise<void> {
  const db = getFirebaseFirestore();
  const ref = doc(tasksCollection(db, uid), taskId);
  await updateDoc(ref, {
    completedAt: completed ? serverTimestamp() : null,
  });
}

export async function updateTaskPhotoUrl(uid: string, taskId: string, photoUrl: string | null): Promise<void> {
  const db = getFirebaseFirestore();
  const ref = doc(tasksCollection(db, uid), taskId);
  await updateDoc(ref, {
    photoUrl,
  });
}

export async function saveTaskPhotoFromLocalUri(uid: string, taskId: string, localUri: string): Promise<string> {
  const url = await uploadTaskPhoto(uid, taskId, localUri);
  await updateTaskPhotoUrl(uid, taskId, url);
  return url;
}

export async function clearTaskPhoto(uid: string, taskId: string): Promise<void> {
  await deleteTaskPhotoObject(uid, taskId);
  await updateTaskPhotoUrl(uid, taskId, null);
}

export async function clearTaskDeedFeedPostId(uid: string, taskId: string): Promise<void> {
  const db = getFirebaseFirestore();
  const ref = doc(tasksCollection(db, uid), taskId);
  await updateDoc(ref, { deedFeedPostId: null });
}

export async function addUserTask(uid: string, title: string): Promise<void> {
  const trimmed = title.trim();
  if (!trimmed) {
    return;
  }
  const db = getFirebaseFirestore();
  const col = tasksCollection(db, uid);
  const sortKey = Date.now();
  await addDoc(col, {
    taskId: `custom_${sortKey}`,
    textShort: trimmed,
    textLong: '',
    active: true,
    category: 'custom',
    difficulty: 2,
    minAge: 1,
    maxAge: 999,
    traits: ['Any'],
    materials: [],
    picture: false,
    photoUrl: null,
    deedFeedPostId: null,
    cadence: 'anytime',
    sortKey,
    createdAt: serverTimestamp(),
    completedAt: null,
  });
}
