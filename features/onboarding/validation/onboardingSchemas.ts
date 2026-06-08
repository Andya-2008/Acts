import { z } from 'zod';

import { requiredActsPhoneSchema } from '@/features/auth/validation/authSchemas';
import {
  choiceIds,
  favoriteActivityChoices,
  goalChoices,
  growthGoalChoices,
  hobbyChoices,
  interestChoices,
  personalityTraitChoices,
} from '@/features/onboarding/config/personalizationChoices';

function multiPick(ids: Set<string>, max: number, label: string) {
  return z
    .array(z.string())
    .min(1, `Select at least one for ${label}.`)
    .max(max, `Choose at most ${max} for ${label}.`)
    .refine((arr) => arr.every((x) => ids.has(x)), { message: `Invalid choice for ${label}.` });
}

const namePart = (which: 'first' | 'last') => {
  const label = which === 'first' ? 'first name' : 'last name';
  return z
    .string()
    .trim()
    .min(1, `Enter your ${label}.`)
    .max(60, `${which === 'first' ? 'First' : 'Last'} name is too long.`);
};

export const onboardingStep0Schema = z.object({
  first: namePart('first'),
  last: namePart('last'),
  phone: requiredActsPhoneSchema,
  hobbies: multiPick(choiceIds(hobbyChoices), 6, 'hobbies'),
  interests: multiPick(choiceIds(interestChoices), 6, 'interests'),
  favoriteActivities: multiPick(choiceIds(favoriteActivityChoices), 6, 'favorite activities'),
});

export const onboardingStep1Schema = z.object({
  goals: multiPick(choiceIds(goalChoices), 5, 'goals'),
  growthGoals: multiPick(choiceIds(growthGoalChoices), 5, 'growth goals'),
  personalityTraits: multiPick(choiceIds(personalityTraitChoices), 5, 'personality traits'),
  taskDifficulty: z.enum(['easy', 'medium', 'hard'], {
    error: 'Choose a difficulty preference.',
  }),
  hasKids: z.boolean(),
});

export const onboardingStep2Schema = z.object({
  becomeCategory: z.string().min(1, 'Pick one Become path.'),
});

export const onboardingFullSchema = onboardingStep0Schema
  .merge(onboardingStep1Schema)
  .merge(onboardingStep2Schema);

export type OnboardingFormParsed = z.infer<typeof onboardingFullSchema>;
