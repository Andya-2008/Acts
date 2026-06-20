import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import { router, type Href } from 'expo-router';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Pressable, View } from 'react-native';

import { PersonalizationChipPicker } from '@/features/onboarding/components/PersonalizationChipPicker';
import {
  interestChoices,
  labelsFromChoiceIds,
} from '@/features/onboarding/config/personalizationChoices';
import { submitQuickPersonalization } from '@/features/onboarding/services/submitOnboarding';
import {
  quickPersonalizationInterestsSchema,
  quickPersonalizationSchema,
  type QuickPersonalizationParsed,
} from '@/features/onboarding/validation/quickPersonalizationSchemas';
import { tasksQueryKeys } from '@/features/tasks/queryKeys';
import { userInfoQueryKeys } from '@/features/user-profile/queryKeys';
import { mapAuthError } from '@/features/auth/utils/mapAuthError';
import { AppButton, AppCard, AppText } from '@/shared/components/ui';

type QuickStep = 0 | 1;

type QuickPersonalizationWizardProps = {
  userId: string;
  completionHref?: Href;
  onSaved?: () => void;
};

export function QuickPersonalizationWizard({
  userId,
  completionHref = '/(app)/(tabs)/tasks' as Href,
  onSaved,
}: QuickPersonalizationWizardProps) {
  const queryClient = useQueryClient();
  const [step, setStep] = useState<QuickStep>(0);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const { control, handleSubmit, trigger, getValues } = useForm<QuickPersonalizationParsed>({
    resolver: zodResolver(quickPersonalizationSchema),
    defaultValues: {
      interests: [],
      taskDifficulty: 'medium',
    },
    mode: 'onBlur',
  });

  const goNext = async () => {
    setSubmitError(null);
    const parsed = quickPersonalizationInterestsSchema.safeParse({
      interests: getValues('interests'),
    });
    if (!parsed.success) {
      await trigger('interests', { shouldFocus: true });
      return;
    }
    setStep(1);
  };

  const onFinish = handleSubmit(async (values) => {
    setSubmitError(null);
    const parsed = quickPersonalizationSchema.safeParse(values);
    if (!parsed.success) {
      setSubmitError('Please review your choices.');
      return;
    }
    try {
      await submitQuickPersonalization(
        userId,
        parsed.data,
        labelsFromChoiceIds(parsed.data.interests, interestChoices),
      );
      await queryClient.invalidateQueries({ queryKey: userInfoQueryKeys.detail(userId) });
      await queryClient.invalidateQueries({ queryKey: tasksQueryKeys.list(userId) });
      onSaved?.();
      router.replace(completionHref);
    } catch (error) {
      setSubmitError(mapAuthError(error));
    }
  });

  const goBack = () => {
    setSubmitError(null);
    setStep(0);
  };

  return (
    <View>
      <AppText variant="caption" className="mb-1 text-acts-green">
        Step {step + 1} of 2
      </AppText>
      <AppText variant="subtitle" className="mb-1 text-acts-ink">
        {step === 0 ? 'What are you into?' : 'How challenging should acts feel?'}
      </AppText>
      <AppText variant="caption" className="mb-4 leading-5 text-acts-muted">
        {step === 0
          ? 'Pick up to three — we use these to rank acts on your Tasks list.'
          : 'You can change this anytime in Settings → Personalization.'}
      </AppText>

      {step === 0 ? (
        <AppCard>
          <Controller
            control={control}
            name="interests"
            render={({ field: { onChange, value }, fieldState: { error } }) => (
              <PersonalizationChipPicker
                choices={interestChoices}
                value={value}
                onChange={onChange}
                max={3}
                errorMessage={error?.message}
              />
            )}
          />
        </AppCard>
      ) : (
        <AppCard>
          <Controller
            control={control}
            name="taskDifficulty"
            render={({ field: { value, onChange }, fieldState: { error } }) => (
              <View>
                <View className="flex-row flex-wrap gap-2">
                  {(['easy', 'medium', 'hard'] as const).map((level) => (
                    <Pressable
                      key={level}
                      onPress={() => onChange(level)}
                      className={`rounded-2xl border px-4 py-2.5 ${
                        value === level
                          ? 'border-acts-green bg-acts-green-soft'
                          : 'border-acts-border bg-acts-surface'
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
        </AppCard>
      )}

      {submitError ? (
        <AppText variant="caption" className="mt-4 text-acts-danger">
          {submitError}
        </AppText>
      ) : null}

      <View className="mt-6 flex-row gap-3">
        {step === 1 ? (
          <View className="flex-1">
            <AppButton title="Back" variant="ghost" className="w-full" onPress={goBack} />
          </View>
        ) : null}
        <View className="flex-1">
          {step === 0 ? (
            <AppButton title="Continue" className="w-full" onPress={() => void goNext()} />
          ) : (
            <AppButton title="See my acts" className="w-full" onPress={onFinish} />
          )}
        </View>
      </View>
    </View>
  );
}
