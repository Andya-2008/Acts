import {
  choiceIdsFromStoredLabels,
  favoriteActivityChoices,
  goalChoices,
  growthGoalChoices,
  hobbyChoices,
  interestChoices,
  personalityTraitChoices,
} from '@/features/onboarding/config/personalizationChoices';
import type { UserInfoRead } from '@/shared/types/userInfo';
import { formatPhoneInput } from '@/shared/utils/formatPhoneInput';

export type OnboardingFormDefaults = {
  first: string;
  last: string;
  phone: string;
  hobbies: string[];
  interests: string[];
  favoriteActivities: string[];
  goals: string[];
  growthGoals: string[];
  personalityTraits: string[];
  taskDifficulty: 'easy' | 'medium' | 'hard';
  hasKids: boolean;
  becomeCategory: string;
};

function taskDifficultyFromProfile(v: UserInfoRead['TaskDifficulty']): 'easy' | 'medium' | 'hard' {
  if (v === 'easy' || v === 'hard' || v === 'medium') {
    return v;
  }
  return 'medium';
}

/** Builds react-hook-form defaults from `userInfo` for editing personalization. */
export function mapUserInfoToWizardDefaults(info: UserInfoRead): OnboardingFormDefaults {
  return {
    first: String(info.First ?? '').trim(),
    last: String(info.Last ?? '').trim(),
    phone: formatPhoneInput(String(info.Phone ?? '').trim()),
    hobbies: choiceIdsFromStoredLabels(info.Hobbies, hobbyChoices),
    interests: choiceIdsFromStoredLabels(info.Interests, interestChoices),
    favoriteActivities: choiceIdsFromStoredLabels(info.FavoriteActivities, favoriteActivityChoices),
    goals: choiceIdsFromStoredLabels(info.Goals, goalChoices),
    growthGoals: choiceIdsFromStoredLabels(info.GrowthGoals, growthGoalChoices),
    personalityTraits: choiceIdsFromStoredLabels(info.PersonalityTraits, personalityTraitChoices),
    taskDifficulty: taskDifficultyFromProfile(info.TaskDifficulty),
    hasKids: Boolean(info.HasKids),
    becomeCategory: String(info.BecomeCategory ?? '').trim(),
  };
}
