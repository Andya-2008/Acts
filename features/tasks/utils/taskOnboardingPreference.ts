import {
  choiceIdsFromStoredLabels,
  favoriteActivityChoices,
  goalChoices,
  growthGoalChoices,
  hobbyChoices,
  interestChoices,
  personalityTraitChoices,
} from '@/features/onboarding/config/personalizationChoices';
import type { TaskCatalogEntry } from '@/shared/types/task';
import type { UserInfoRead } from '@/shared/types/userInfo';
import { preferredDifficultyLevelFromActs } from '@/shared/utils/preferredTaskDifficulty';
import { mergeActsDefaults } from '@/shared/types/actsSettings';

type TaskCategory =
  | 'adventure'
  | 'community'
  | 'creative'
  | 'emotional'
  | 'environmental'
  | 'general'
  | 'self-care';

type ChoicePreference = {
  categories?: Partial<Record<TaskCategory, number>>;
  traits?: string[];
};

/** Maps onboarding choice ids to catalog categories and traits for roster ranking. */
const CHOICE_PREFS: Record<string, ChoicePreference> = {
  // Hobbies
  reading: { categories: { creative: 2, emotional: 1, general: 1 } },
  outdoors: { categories: { adventure: 3, environmental: 2 }, traits: ['environmentalist'] },
  fitness: { categories: { adventure: 2, 'self-care': 2 } },
  cooking: { categories: { creative: 1, community: 2, general: 1 }, traits: ['chef'] },
  music: { categories: { creative: 3, community: 1 } },
  art: { categories: { creative: 3 }, traits: ['artsy'] },
  games: { categories: { community: 2, adventure: 1 } },
  photo: { categories: { creative: 2, adventure: 1 }, traits: ['artsy'] },
  travel: { categories: { adventure: 3 } },
  crafts: { categories: { creative: 3 }, traits: ['craftsy', 'artsy'] },
  garden: { categories: { environmental: 3, 'self-care': 1 }, traits: ['environmentalist'] },
  volunteer: { categories: { community: 3, environmental: 1 } },

  // Interests
  wellness: { categories: { 'self-care': 3, emotional: 2 } },
  science: { categories: { adventure: 2, environmental: 2 } },
  history: { categories: { general: 2, community: 1 } },
  faith: { categories: { emotional: 2, 'self-care': 2 } },
  community: { categories: { community: 3 } },
  arts: { categories: { creative: 3 }, traits: ['artsy'] },
  tech: { categories: { general: 2, creative: 1 } },
  parenting: { categories: { community: 2, general: 2 } },
  career: { categories: { general: 2 } },
  finance: { categories: { general: 2 } },
  books: { categories: { creative: 2, emotional: 1 } },
  sustainability: { categories: { environmental: 3 }, traits: ['environmentalist'] },

  // Favorite activities
  walks: { categories: { adventure: 2, 'self-care': 2 } },
  friends: { categories: { community: 3 }, traits: ['extrovert'] },
  quiet: { categories: { 'self-care': 3, emotional: 1 } },
  family: { categories: { community: 2, general: 2 } },
  learning: { categories: { general: 2, adventure: 1 } },
  sports: { categories: { adventure: 2 } },
  movies: { categories: { general: 1, community: 1 } },
  faith_practice: { categories: { emotional: 2, 'self-care': 2 } },
  creative: { categories: { creative: 3 }, traits: ['artsy', 'craftsy'] },
  travel_day: { categories: { adventure: 3 } },
  rest: { categories: { 'self-care': 3 } },
  service: { categories: { community: 3, environmental: 1 } },

  // Goals
  relationships: { categories: { community: 3, emotional: 2 } },
  kind_habits: { categories: { general: 2, community: 2 } },
  health: { categories: { 'self-care': 3, adventure: 1 } },
  stress: { categories: { 'self-care': 2, emotional: 2 } },
  skills: { categories: { general: 2, creative: 1 } },
  impact: { categories: { community: 2, environmental: 2 } },
  organized: { categories: { general: 2 } },
  confidence: { categories: { community: 2, creative: 1 }, traits: ['extrovert'] },
  joy: { categories: { general: 2, creative: 1 } },

  // Growth goals
  patience: { categories: { emotional: 2, community: 1 } },
  courage: { categories: { community: 2, adventure: 1 }, traits: ['extrovert'] },
  discipline: { categories: { general: 2 } },
  empathy: { categories: { emotional: 3, community: 2 } },
  leadership: { categories: { community: 2 }, traits: ['extrovert'] },
  speaking: { categories: { community: 2 }, traits: ['extrovert'] },
  emotional: { categories: { emotional: 3 } },
  spiritual: { categories: { emotional: 2, 'self-care': 2 } },
  learning: { categories: { general: 2, adventure: 1 } },
  generosity: { categories: { community: 3 } },
  creativity: { categories: { creative: 3 }, traits: ['artsy', 'craftsy'] },
  balance: { categories: { 'self-care': 2, general: 1 } },

  // Personality (onboarding labels → catalog leaning)
  patient: { categories: { emotional: 1, community: 1 } },
  curious: { categories: { adventure: 2, general: 1 } },
  energetic: { categories: { adventure: 2 }, traits: ['extrovert'] },
  thoughtful: { categories: { emotional: 2 } },
  bold: { categories: { community: 1, adventure: 1 }, traits: ['extrovert'] },
  organized: { categories: { general: 2 } },
  gentle: { categories: { emotional: 2, community: 1 } },
  direct: { categories: { community: 1 }, traits: ['extrovert'] },
  playful: { categories: { community: 2, creative: 1 }, traits: ['extrovert'] },
  steady: { categories: { general: 1, 'self-care': 1 } },
  warm: { categories: { community: 2, emotional: 1 } },
  introspective: { categories: { emotional: 2, 'self-care': 1 } },

  // Become path
  'better-friend': { categories: { community: 3, emotional: 2 } },
  musician: { categories: { creative: 3, community: 1 } },
  'more-active': { categories: { adventure: 3, 'self-care': 1 } },
  creative: { categories: { creative: 3 }, traits: ['artsy', 'craftsy'] },
  confident: { categories: { community: 2 }, traits: ['extrovert'] },
  spiritual: { categories: { emotional: 2, 'self-care': 2 } },
};

function normalizeTrait(s: string): string {
  return s.trim().toLowerCase();
}

function normalizeCategory(s: string): TaskCategory | null {
  const c = s.trim().toLowerCase();
  if (
    c === 'adventure' ||
    c === 'community' ||
    c === 'creative' ||
    c === 'emotional' ||
    c === 'environmental' ||
    c === 'general' ||
    c === 'self-care'
  ) {
    return c;
  }
  return null;
}

/** Collects normalized onboarding choice ids from a user profile. */
export function collectUserOnboardingChoiceIds(user: UserInfoRead | null | undefined): Set<string> {
  const ids = new Set<string>();
  if (!user) {
    return ids;
  }

  for (const id of choiceIdsFromStoredLabels(user.Hobbies, hobbyChoices)) {
    ids.add(id);
  }
  for (const id of choiceIdsFromStoredLabels(user.Interests, interestChoices)) {
    ids.add(id);
  }
  for (const id of choiceIdsFromStoredLabels(user.FavoriteActivities, favoriteActivityChoices)) {
    ids.add(id);
  }
  for (const id of choiceIdsFromStoredLabels(user.Goals, goalChoices)) {
    ids.add(id);
  }
  for (const id of choiceIdsFromStoredLabels(user.GrowthGoals, growthGoalChoices)) {
    ids.add(id);
  }
  for (const id of choiceIdsFromStoredLabels(user.PersonalityTraits, personalityTraitChoices)) {
    ids.add(id);
  }

  const become = String(user.BecomeCategory ?? '').trim();
  if (become) {
    ids.add(become);
  }

  return ids;
}

export function userHasOnboardingPreferences(user: UserInfoRead | null | undefined): boolean {
  return collectUserOnboardingChoiceIds(user).size > 0;
}

/** Higher score = better match for this user's onboarding answers. */
export function scoreTaskOnboardingMatch(
  task: Pick<TaskCatalogEntry, 'category' | 'traits'>,
  user: UserInfoRead | null | undefined,
): number {
  const choiceIds = collectUserOnboardingChoiceIds(user);
  if (choiceIds.size === 0) {
    return 0;
  }

  const category = normalizeCategory(task.category);
  const taskTraits = new Set(task.traits.map(normalizeTrait));
  let score = 0;

  for (const choiceId of choiceIds) {
    const pref = CHOICE_PREFS[choiceId];
    if (!pref) {
      continue;
    }
    if (category && pref.categories?.[category]) {
      score += pref.categories[category]!;
    }
    for (const trait of pref.traits ?? []) {
      if (taskTraits.has(normalizeTrait(trait))) {
        score += 2;
      }
    }
  }

  return score;
}

/** Difficulty preference from Acts settings, falling back to onboarding `TaskDifficulty`. */
export function preferredDifficultyLevelForUser(
  user: UserInfoRead | null | undefined,
): 1 | 2 | 3 {
  const acts = mergeActsDefaults(user?.ActsSettings);
  if (user?.ActsSettings?.preferredDifficulty) {
    return preferredDifficultyLevelFromActs(acts.preferredDifficulty);
  }
  if (user?.TaskDifficulty) {
    return preferredDifficultyLevelFromActs(user.TaskDifficulty);
  }
  return preferredDifficultyLevelFromActs(acts.preferredDifficulty);
}
