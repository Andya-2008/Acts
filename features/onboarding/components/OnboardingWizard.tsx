import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import { router, type Href } from 'expo-router';
import { useMemo, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Pressable, View } from 'react-native';

import {
  favoriteActivityChoices,
  goalChoices,
  growthGoalChoices,
  hobbyChoices,
  interestChoices,
  labelsFromChoiceIds,
  personalityTraitChoices,
  type PersonalizationChoice,
} from '@/features/onboarding/config/personalizationChoices';
import { submitOnboarding } from '@/features/onboarding/services/submitOnboarding';
import {
  onboardingFullSchema,
  onboardingStep0Schema,
  onboardingStep1Schema,
  onboardingStep2Schema,
} from '@/features/onboarding/validation/onboardingSchemas';
import { userInfoQueryKeys } from '@/features/user-profile/queryKeys';
import { mapAuthError } from '@/features/auth/utils/mapAuthError';
import { becomeCategoryOptions } from '@/shared/config/becomeCategories';
import { AppButton, AppCard, AppText, AppTextField, Screen } from '@/shared/components/ui';
import { formatPhoneInput } from '@/shared/utils/formatPhoneInput';

import type { OnboardingFormDefaults } from '@/features/onboarding/utils/mapUserInfoToWizardDefaults';

type WizardStep = 0 | 1 | 2;

export type OnboardingFormValues = {
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

type FormValues = OnboardingFormValues;

const defaultValues: FormValues = {
  first: '',
  last: '',
  phone: '',
  hobbies: [],
  interests: [],
  favoriteActivities: [],
  goals: [],
  growthGoals: [],
  personalityTraits: [],
  taskDifficulty: 'medium',
  hasKids: false,
  becomeCategory: '',
};

function MultiSelectChips({
  choices,
  value,
  onChange,
  errorMessage,
}: {
  choices: PersonalizationChoice[];
  value: string[];
  onChange: (next: string[]) => void;
  errorMessage?: string;
}) {
  const toggle = (id: string) => {
    if (value.includes(id)) onChange(value.filter((x) => x !== id));
    else onChange([...value, id]);
  };
  return (
    <View className="mb-2">
      <View className="flex-row flex-wrap gap-2">
        {choices.map((c) => {
          const selected = value.includes(c.id);
          return (
            <Pressable
              key={c.id}
              onPress={() => toggle(c.id)}
              className={`rounded-2xl border px-4 py-2.5 ${
                selected ? 'border-acts-green bg-acts-green-soft' : 'border-acts-border bg-acts-surface'
              }`}>
              <AppText variant="caption" className="text-acts-ink">
                {c.label}
              </AppText>
            </Pressable>
          );
        })}
      </View>
      {errorMessage ? (
        <AppText variant="caption" className="mt-1 text-acts-danger">
          {errorMessage}
        </AppText>
      ) : null}
    </View>
  );
}

type OnboardingWizardProps = {
  userId: string;
  /** Prefill when the profile already has a phone (e.g. re-run onboarding edge cases). */
  initialPhone?: string;
  initialFirst?: string;
  initialLast?: string;
  /** Full defaults when editing an existing profile (name, chips, Become path, etc.). */
  personalizationDefaults?: OnboardingFormDefaults | null;
  /** `welcome` = first-time copy; `edit` = update copy and save stays on screen by default. */
  variant?: 'welcome' | 'edit';
  /** After save: go to `completionHref`, or stay and run `onSaved` (e.g. collapse editor on Profile). */
  submitBehavior?: 'navigate' | 'stay';
  onSaved?: () => void;
  /** Where to go after successful submit (default: Profile tab). */
  completionHref?: Href;
  /** `screen` = own `Screen` wrapper; `embedded` = fragment for use inside an existing `Screen`. */
  layout?: 'screen' | 'embedded';
};

export function OnboardingWizard({
  userId,
  initialPhone = '',
  initialFirst = '',
  initialLast = '',
  personalizationDefaults = null,
  variant = 'welcome',
  submitBehavior,
  onSaved,
  completionHref = '/(app)/(tabs)/profile' as Href,
  layout = 'screen',
}: OnboardingWizardProps) {
  const queryClient = useQueryClient();
  const [step, setStep] = useState<WizardStep>(0);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const resolvedSubmitBehavior = submitBehavior ?? (variant === 'edit' ? 'stay' : 'navigate');

  const formDefaultValues = useMemo<FormValues>(
    () => ({
      ...defaultValues,
      first: initialFirst.trim(),
      last: initialLast.trim(),
      phone: formatPhoneInput(initialPhone.trim()),
      ...(personalizationDefaults ?? {}),
    }),
    [initialFirst, initialLast, initialPhone, personalizationDefaults],
  );

  const { control, handleSubmit, trigger, getValues } = useForm<FormValues>({
    resolver: zodResolver(onboardingFullSchema),
    defaultValues: formDefaultValues,
    mode: 'onBlur',
  });

  const goNext = async () => {
    setSubmitError(null);
    if (step === 0) {
      const parsed = onboardingStep0Schema.safeParse({
        first: getValues('first'),
        last: getValues('last'),
        phone: getValues('phone'),
        hobbies: getValues('hobbies'),
        interests: getValues('interests'),
        favoriteActivities: getValues('favoriteActivities'),
      });
      if (!parsed.success) {
        await trigger(['first', 'last', 'phone', 'hobbies', 'interests', 'favoriteActivities'], {
          shouldFocus: true,
        });
        return;
      }
      setStep(1);
      return;
    }
    if (step === 1) {
      const parsed = onboardingStep1Schema.safeParse({
        goals: getValues('goals'),
        growthGoals: getValues('growthGoals'),
        personalityTraits: getValues('personalityTraits'),
        taskDifficulty: getValues('taskDifficulty'),
        hasKids: getValues('hasKids'),
      });
      if (!parsed.success) {
        await trigger(['goals', 'growthGoals', 'personalityTraits', 'taskDifficulty', 'hasKids'], {
          shouldFocus: true,
        });
        return;
      }
      setStep(2);
    }
  };

  const goBack = () => {
    setSubmitError(null);
    if (step === 1) {
      setStep(0);
    } else if (step === 2) {
      setStep(1);
    }
  };

  const onFinish = handleSubmit(async (values) => {
    setSubmitError(null);
    const parsed = onboardingFullSchema.safeParse(values);
    if (!parsed.success) {
      setSubmitError('Please review your answers.');
      return;
    }
    const v = parsed.data;
    try {
      await submitOnboarding(userId, {
        First: v.first.trim(),
        Last: v.last.trim(),
        Phone: v.phone.trim(),
        Hobbies: labelsFromChoiceIds(v.hobbies, hobbyChoices),
        Interests: labelsFromChoiceIds(v.interests, interestChoices),
        FavoriteActivities: labelsFromChoiceIds(v.favoriteActivities, favoriteActivityChoices),
        Goals: labelsFromChoiceIds(v.goals, goalChoices),
        GrowthGoals: labelsFromChoiceIds(v.growthGoals, growthGoalChoices),
        PersonalityTraits: labelsFromChoiceIds(v.personalityTraits, personalityTraitChoices),
        TaskDifficulty: v.taskDifficulty,
        HasKids: v.hasKids,
        BecomeCategory: v.becomeCategory,
      });
      await queryClient.invalidateQueries({ queryKey: userInfoQueryKeys.detail(userId) });
      if (resolvedSubmitBehavior === 'stay') {
        onSaved?.();
      } else {
        router.replace(completionHref);
      }
    } catch (error) {
      setSubmitError(mapAuthError(error));
    }
  });

  const isEdit = variant === 'edit';

  const body = (
    <View className="py-6">
        <AppText variant="caption" className="mb-1 text-acts-green">
          Step {step + 1} of 3{isEdit ? ' · editing' : ''}
        </AppText>
        <AppText variant="title" className="mb-4">
          {isEdit ? 'Update your choices' : 'Welcome in'}
        </AppText>

        {step === 0 ? (
          <AppCard>
            <AppText variant="subtitle" className="mb-2">
              Your name
            </AppText>
            <Controller
              control={control}
              name="first"
              render={({ field: { onChange, onBlur, value }, fieldState: { error } }) => (
                <AppTextField
                  label="First name"
                  placeholder="First name"
                  autoCapitalize="words"
                  textContentType="givenName"
                  autoComplete="name-given"
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                  errorMessage={error?.message}
                />
              )}
            />
            <Controller
              control={control}
              name="last"
              render={({ field: { onChange, onBlur, value }, fieldState: { error } }) => (
                <AppTextField
                  label="Last name"
                  placeholder="Last name"
                  autoCapitalize="words"
                  textContentType="familyName"
                  autoComplete="name-family"
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                  errorMessage={error?.message}
                />
              )}
            />
            <AppText variant="subtitle" className="mb-2 mt-2">
              Your phone number (optional)
            </AppText>
            <Controller
              control={control}
              name="phone"
              render={({ field: { onChange, onBlur, value }, fieldState: { error } }) => (
                <AppTextField
                  label="Mobile number (optional)"
                  placeholder="e.g. (555) 123-4567"
                  keyboardType="phone-pad"
                  textContentType="telephoneNumber"
                  autoComplete="tel"
                  onBlur={onBlur}
                  onChangeText={(t) => onChange(formatPhoneInput(t))}
                  value={value}
                  maxLength={14}
                  errorMessage={error?.message}
                />
              )}
            />
            <AppText variant="subtitle" className="mb-4 mt-2">
              Interests & joy
            </AppText>
            <AppText variant="label" className="mb-2">
              Hobbies
            </AppText>
            <Controller
              control={control}
              name="hobbies"
              render={({ field: { onChange, value }, fieldState: { error } }) => (
                <MultiSelectChips
                  choices={hobbyChoices}
                  value={value}
                  onChange={onChange}
                  errorMessage={error?.message}
                />
              )}
            />
            <AppText variant="label" className="mb-2">
              Interests
            </AppText>
            <Controller
              control={control}
              name="interests"
              render={({ field: { onChange, value }, fieldState: { error } }) => (
                <MultiSelectChips
                  choices={interestChoices}
                  value={value}
                  onChange={onChange}
                  errorMessage={error?.message}
                />
              )}
            />
            <AppText variant="label" className="mb-2">
              Favorite activities
            </AppText>
            <Controller
              control={control}
              name="favoriteActivities"
              render={({ field: { onChange, value }, fieldState: { error } }) => (
                <MultiSelectChips
                  choices={favoriteActivityChoices}
                  value={value}
                  onChange={onChange}
                  errorMessage={error?.message}
                />
              )}
            />
          </AppCard>
        ) : null}

        {step === 1 ? (
          <AppCard>
            <AppText variant="subtitle" className="mb-4">
              Goals & style
            </AppText>
            <AppText variant="label" className="mb-2">
              Goals
            </AppText>
            <Controller
              control={control}
              name="goals"
              render={({ field: { onChange, value }, fieldState: { error } }) => (
                <MultiSelectChips
                  choices={goalChoices}
                  value={value}
                  onChange={onChange}
                  errorMessage={error?.message}
                />
              )}
            />
            <AppText variant="label" className="mb-2">
              Personal growth goals
            </AppText>
            <Controller
              control={control}
              name="growthGoals"
              render={({ field: { onChange, value }, fieldState: { error } }) => (
                <MultiSelectChips
                  choices={growthGoalChoices}
                  value={value}
                  onChange={onChange}
                  errorMessage={error?.message}
                />
              )}
            />
            <AppText variant="label" className="mb-2">
              Personality traits
            </AppText>
            <Controller
              control={control}
              name="personalityTraits"
              render={({ field: { onChange, value }, fieldState: { error } }) => (
                <MultiSelectChips
                  choices={personalityTraitChoices}
                  value={value}
                  onChange={onChange}
                  errorMessage={error?.message}
                />
              )}
            />

            <AppText variant="label" className="mb-2">
              Preferred task difficulty
            </AppText>
            <Controller
              control={control}
              name="taskDifficulty"
              render={({ field: { value, onChange }, fieldState: { error } }) => (
                <View className="mb-2">
                  <View className="flex-row flex-wrap gap-2">
                    {(['easy', 'medium', 'hard'] as const).map((level) => (
                      <Pressable
                        key={level}
                        onPress={() => onChange(level)}
                        className={`rounded-2xl border px-4 py-2.5 ${
                          value === level ? 'border-acts-green bg-acts-green-soft' : 'border-acts-border bg-acts-surface'
                        }`}>
                        <AppText variant="caption" className="capitalize text-acts-ink">
                          {level}
                        </AppText>
                      </Pressable>
                    ))}
                  </View>
                  {error?.message ? (
                    <AppText variant="caption" className="mt-1 text-acts-danger">
                      {error.message}
                    </AppText>
                  ) : null}
                </View>
              )}
            />

            <AppText variant="label" className="mb-2 mt-2">
              Kids at home
            </AppText>
            <Controller
              control={control}
              name="hasKids"
              render={({ field: { value, onChange }, fieldState: { error } }) => (
                <View className="mb-2">
                  <View className="flex-row flex-wrap gap-2">
                    {(
                      [
                        { id: false as const, label: 'No' },
                        { id: true as const, label: 'Yes' },
                      ] as const
                    ).map((opt) => {
                      const selected = value === opt.id;
                      return (
                        <Pressable
                          key={opt.label}
                          onPress={() => onChange(opt.id)}
                          className={`rounded-2xl border px-4 py-2.5 ${
                            selected ? 'border-acts-green bg-acts-green-soft' : 'border-acts-border bg-acts-surface'
                          }`}>
                          <AppText variant="caption" className="text-acts-ink">
                            {opt.label}
                          </AppText>
                        </Pressable>
                      );
                    })}
                  </View>
                  {error?.message ? (
                    <AppText variant="caption" className="mt-1 text-acts-danger">
                      {error.message}
                    </AppText>
                  ) : null}
                </View>
              )}
            />
          </AppCard>
        ) : null}

        {step === 2 ? (
          <AppCard>
            <AppText variant="subtitle" className="mb-2">
              Your Become path
            </AppText>
            <Controller
              control={control}
              name="becomeCategory"
              render={({ field: { value, onChange }, fieldState: { error } }) => (
                <View className="gap-3">
                  {becomeCategoryOptions.map((opt) => {
                    const selected = value === opt.id;
                    return (
                      <Pressable
                        key={opt.id}
                        onPress={() => onChange(opt.id)}
                        className={`rounded-2xl border p-4 ${
                          selected ? 'border-acts-green bg-acts-green-soft' : 'border-acts-border bg-acts-surface'
                        }`}>
                        <AppText variant="subtitle">{opt.title}</AppText>
                        <AppText variant="caption" className="mt-1">
                          {opt.subtitle}
                        </AppText>
                      </Pressable>
                    );
                  })}
                  {error?.message ? (
                    <AppText variant="caption" className="text-acts-danger">
                      {error.message}
                    </AppText>
                  ) : null}
                </View>
              )}
            />
          </AppCard>
        ) : null}

        {submitError ? (
          <AppText variant="caption" className="mt-4 text-acts-danger">
            {submitError}
          </AppText>
        ) : null}

        <View className="mt-8 flex-row gap-3">
          {step > 0 ? (
            <View className="flex-1">
              <AppButton title="Back" variant="ghost" className="w-full" onPress={goBack} />
            </View>
          ) : null}
          <View className="flex-1">
            {step < 2 ? (
              <AppButton title="Continue" className="w-full" onPress={() => void goNext()} />
            ) : (
              <AppButton title={isEdit ? 'Save changes' : 'Finish'} className="w-full" onPress={onFinish} />
            )}
          </View>
        </View>
      </View>
  );

  if (layout === 'embedded') {
    return body;
  }

  return <Screen scroll>{body}</Screen>;
}
