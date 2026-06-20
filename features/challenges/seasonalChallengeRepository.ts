import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';

import { firestoreCollections } from '@/shared/config/firestore';
import { getFirebaseFirestore } from '@/shared/services/firebase/client';
import { fetchUserInfo, grantLifetimeXp } from '@/features/user-profile/services/userInfoRepository';
import { enqueueRankUpIfPromotion } from '@/features/progression/enqueueRankUpIfPromotion';
import { uploadSeasonChallengePhoto } from '@/shared/services/firebase/storageUploads';

import type { SeasonalChallenge, SeasonalSeason } from './data/seasons';

/**
 * Client-only seasonal challenge progress.
 *
 * Progress lives at `userInfo/{uid}/seasonProgress/{seasonId}`, which only the owner can
 * read/write (see `firestore.rules` → `match /userInfo/{userId}/{document=**}`). XP is awarded
 * through `grantLifetimeXp`, so seasonal rewards feed the same lifetime XP / service rank the
 * rest of the app uses. No cross-user writes and no server are required.
 */

const SEASON_PROGRESS = 'seasonProgress';

export type SeasonProgress = {
  seasonId: string;
  /** challengeId → times completed this season. */
  completions: Record<string, number>;
  /** challengeId → most recent honor-system notes ("what I did"), newest first. */
  notes: Record<string, string[]>;
  /** challengeId → optional photo URLs from completions, newest first. */
  photoUrls: Record<string, string[]>;
  totalXpEarned: number;
};

/** Keep only the most recent few notes per challenge so the doc stays small. */
const MAX_NOTES_PER_CHALLENGE = 3;
const MAX_PHOTOS_PER_CHALLENGE = 3;

function sanitizeNotes(raw: unknown): Record<string, string[]> {
  if (!raw || typeof raw !== 'object') {
    return {};
  }
  const out: Record<string, string[]> = {};
  for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
    if (Array.isArray(value)) {
      const cleaned = value
        .filter((v): v is string => typeof v === 'string')
        .map((v) => v.trim())
        .filter((v) => v.length > 0)
        .slice(0, MAX_NOTES_PER_CHALLENGE);
      if (cleaned.length > 0) {
        out[key] = cleaned;
      }
    }
  }
  return out;
}

function sanitizePhotoUrls(raw: unknown): Record<string, string[]> {
  if (!raw || typeof raw !== 'object') {
    return {};
  }
  const out: Record<string, string[]> = {};
  for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
    if (Array.isArray(value)) {
      const cleaned = value
        .filter((v): v is string => typeof v === 'string')
        .map((v) => v.trim())
        .filter((v) => v.length > 0 && v.startsWith('http'))
        .slice(0, MAX_PHOTOS_PER_CHALLENGE);
      if (cleaned.length > 0) {
        out[key] = cleaned;
      }
    }
  }
  return out;
}

function progressRef(uid: string, seasonId: string) {
  const db = getFirebaseFirestore();
  return doc(db, firestoreCollections.userInfo, uid, SEASON_PROGRESS, seasonId);
}

function emptyProgress(seasonId: string): SeasonProgress {
  return { seasonId, completions: {}, notes: {}, photoUrls: {}, totalXpEarned: 0 };
}

export async function fetchSeasonProgress(uid: string, seasonId: string): Promise<SeasonProgress> {
  const snap = await getDoc(progressRef(uid, seasonId));
  if (!snap.exists()) {
    return emptyProgress(seasonId);
  }
  const data = snap.data() as Partial<SeasonProgress>;
  return {
    seasonId,
    completions: { ...(data.completions ?? {}) },
    notes: sanitizeNotes(data.notes),
    photoUrls: sanitizePhotoUrls(data.photoUrls),
    totalXpEarned: Math.max(0, Math.floor(Number(data.totalXpEarned ?? 0))),
  };
}

/** XP awarded for one completion of `challenge` in `season` (after the season bonus). */
export function seasonalChallengeXp(season: SeasonalSeason, challenge: SeasonalChallenge): number {
  return Math.max(0, Math.round(challenge.xpReward * (season.bonusXpMultiplier || 1)));
}

export type ChallengeCompletionResult = {
  xpGranted: number;
  newCount: number;
  totalXpEarned: number;
};

/**
 * Records one completion of a challenge: bumps the per-challenge count, adds XP to the season
 * total, and grants lifetime XP. An optional honor-system note ("what I did") is stored so the
 * user can look back on what they logged. Throws if already at the max completions.
 */
export async function recordChallengeCompletion(
  uid: string,
  season: SeasonalSeason,
  challenge: SeasonalChallenge,
  note?: string,
  photoLocalUri?: string,
): Promise<ChallengeCompletionResult> {
  const progress = await fetchSeasonProgress(uid, season.id);
  const current = progress.completions[challenge.id] ?? 0;
  if (current >= challenge.maxCompletions) {
    throw new Error('You\u2019ve already completed this challenge the maximum number of times this season.');
  }

  const xpGranted = seasonalChallengeXp(season, challenge);
  const newCount = current + 1;
  const totalXpEarned = progress.totalXpEarned + xpGranted;

  const trimmedNote = note?.trim() ?? '';
  const nextNotes = { ...progress.notes };
  if (trimmedNote.length > 0) {
    const existing = nextNotes[challenge.id] ?? [];
    nextNotes[challenge.id] = [trimmedNote, ...existing].slice(0, MAX_NOTES_PER_CHALLENGE);
  }

  const nextPhotoUrls = { ...progress.photoUrls };
  const photoUri = photoLocalUri?.trim();
  if (photoUri && photoUri.length > 0) {
    const downloadUrl = await uploadSeasonChallengePhoto(uid, season.id, challenge.id, photoUri);
    const existingPhotos = nextPhotoUrls[challenge.id] ?? [];
    nextPhotoUrls[challenge.id] = [downloadUrl, ...existingPhotos].slice(0, MAX_PHOTOS_PER_CHALLENGE);
  }

  await setDoc(
    progressRef(uid, season.id),
    {
      seasonId: season.id,
      completions: { ...progress.completions, [challenge.id]: newCount },
      notes: nextNotes,
      photoUrls: nextPhotoUrls,
      totalXpEarned,
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );

  if (xpGranted > 0) {
    const userInfo = await fetchUserInfo(uid);
    const prevXp = Math.max(0, Math.floor(Number(userInfo?.LifetimeXP ?? 0)));
    await grantLifetimeXp(uid, xpGranted);
    enqueueRankUpIfPromotion(prevXp, xpGranted);
  }

  return { xpGranted, newCount, totalXpEarned };
}
