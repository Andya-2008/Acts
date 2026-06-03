import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';

import { firestoreCollections } from '@/shared/config/firestore';
import { getFirebaseFirestore } from '@/shared/services/firebase/client';
import { grantLifetimeXp } from '@/features/user-profile/services/userInfoRepository';

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
  totalXpEarned: number;
};

function progressRef(uid: string, seasonId: string) {
  const db = getFirebaseFirestore();
  return doc(db, firestoreCollections.userInfo, uid, SEASON_PROGRESS, seasonId);
}

function emptyProgress(seasonId: string): SeasonProgress {
  return { seasonId, completions: {}, totalXpEarned: 0 };
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
 * total, and grants lifetime XP. Throws if the challenge is already at its max completions.
 */
export async function recordChallengeCompletion(
  uid: string,
  season: SeasonalSeason,
  challenge: SeasonalChallenge,
): Promise<ChallengeCompletionResult> {
  const progress = await fetchSeasonProgress(uid, season.id);
  const current = progress.completions[challenge.id] ?? 0;
  if (current >= challenge.maxCompletions) {
    throw new Error('You\u2019ve already completed this challenge the maximum number of times this season.');
  }

  const xpGranted = seasonalChallengeXp(season, challenge);
  const newCount = current + 1;
  const totalXpEarned = progress.totalXpEarned + xpGranted;

  await setDoc(
    progressRef(uid, season.id),
    {
      seasonId: season.id,
      completions: { ...progress.completions, [challenge.id]: newCount },
      totalXpEarned,
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );

  if (xpGranted > 0) {
    await grantLifetimeXp(uid, xpGranted);
  }

  return { xpGranted, newCount, totalXpEarned };
}
