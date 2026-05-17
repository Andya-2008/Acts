import { zodResolver } from '@hookform/resolvers/zod';
import { Link } from 'expo-router';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';

import { mapAuthError } from '@/features/auth/utils/mapAuthError';
import {
  forgotPasswordSchema,
  type ForgotPasswordFormValues,
} from '@/features/auth/validation/authSchemas';
import { sendPasswordReset } from '@/features/auth/services/authService';
import { AppButton, AppCard, AppText, AppTextField, FadeInView, Screen } from '@/shared/components/ui';

export default function ForgotPasswordScreen() {
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' },
  });

  const onSubmit = handleSubmit(async (values) => {
    setSubmitError(null);
    try {
      await sendPasswordReset(values.email);
      setSent(true);
    } catch (error) {
      setSubmitError(mapAuthError(error));
    }
  });

  return (
    <Screen scroll scrollContentContainerStyle={{ justifyContent: 'center' }}>
      <FadeInView>
        <AppText variant="title" className="mb-4">
          Reset password
        </AppText>

        <AppCard>
          <Controller
            control={control}
            name="email"
            render={({ field: { onChange, onBlur, value } }) => (
              <AppTextField
                label="Email"
                autoCapitalize="none"
                autoComplete="email"
                keyboardType="email-address"
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
                errorMessage={errors.email?.message}
              />
            )}
          />

          {sent ? (
            <AppText variant="caption" className="mb-4 text-acts-green">
              Check your inbox for reset instructions.
            </AppText>
          ) : null}

          {submitError ? (
            <AppText variant="caption" className="mb-4 text-acts-danger">
              {submitError}
            </AppText>
          ) : null}

          <AppButton title="Send reset email" loading={isSubmitting} onPress={onSubmit} />

          <Link href="/(auth)/login" className="mt-4 self-center py-2">
            <AppText variant="caption" className="text-acts-blue">
              Back to sign in
            </AppText>
          </Link>
        </AppCard>
      </FadeInView>
    </Screen>
  );
}
