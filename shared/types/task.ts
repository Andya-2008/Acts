import type { Timestamp } from 'firebase/firestore';

export type TaskCadence = 'daily' | 'weekly' | 'monthly' | 'anytime';

export type TaskDifficultyLevel = 1 | 2 | 3;

/** Firestore `userInfo/{uid}/tasks/{taskId}` - catalog tasks + optional custom acts. */
export type ActTask = {
  id: string;
  taskId: string;
  textShort: string;
  textLong: string;
  active: boolean;
  category: string;
  difficulty: TaskDifficultyLevel;
  minAge: number;
  maxAge: number;
  traits: string[];
  materials: string[];
  picture: boolean;
  /** User-uploaded image (Firebase Storage download URL). */
  photoUrl: string | null;
  /** Set when this act's memory was shared to the deed feed (same Firestore `deedPosts` doc id). */
  deedFeedPostId: string | null;
  cadence: TaskCadence;
  sortKey: number;
  /** Calendar period this catalog act was assigned for (daily / weekly / monthly home roster). */
  assignedPeriodKey?: string | null;
  createdAt: Timestamp | null;
  completedAt: Timestamp | null;
  /** Seeds actually granted on last completion (for correct undo + weekend bonus). */
  lastCompletionSeeds?: number | null;
  /** Lifetime XP delta granted on last completion (for correct undo + weekend bonus). */
  lastCompletionXp?: number | null;
};

export type TaskCatalogEntry = Omit<ActTask, 'id' | 'createdAt' | 'completedAt' | 'photoUrl' | 'deedFeedPostId'>;
