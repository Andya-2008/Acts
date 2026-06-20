import { z } from 'zod';

import { choiceIds, interestChoices } from '@/features/onboarding/config/personalizationChoices';

const interestIds = choiceIds(interestChoices);

export const quickPersonalizationInterestsSchema = z.object({
  interests: z
    .array(z.string())
    .min(1, 'Pick at least one interest.')
    .max(3, 'Pick up to three interests.')
    .refine((arr) => arr.every((x) => interestIds.has(x)), { message: 'Invalid interest choice.' }),
});

export const quickPersonalizationDifficultySchema = z.object({
  taskDifficulty: z.enum(['easy', 'medium', 'hard'], {
    error: 'Choose a difficulty preference.',
  }),
});

export const quickPersonalizationSchema = quickPersonalizationInterestsSchema.merge(
  quickPersonalizationDifficultySchema,
);

export type QuickPersonalizationParsed = z.infer<typeof quickPersonalizationSchema>;
