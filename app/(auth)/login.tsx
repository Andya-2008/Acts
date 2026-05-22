import { zodResolver } from '@hookform/resolvers/zod';
import { Link, router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { View } from 'react-native';

import { mapAuthError } from '@/features/auth/utils/mapAuthError';
import { loginSchema, type LoginFormValues } from '@/features/auth/validation/authSchemas';
import { signInWithIdentifier } from '@/features/auth/services/authService';
import { AuthBrandingHeader } from '@/features/auth/components/AuthBrandingHeader';
import { AuthMethodDivider } from '@/features/auth/components/AuthMethodDivider';
import { GoogleSignInSection } from '@/features/auth/components/GoogleSignInSection';
import { shouldShowGoogleAuthOnAuthScreens } from '@/shared/config/googleAuthEnv';
import { AppButton, AppCard, AppText, AppTextField, FadeInView, Screen } from '@/shared/components/ui';
import { actsTheme } from '@/shared/theme/actsTheme';
import { useAuthStore } from '@/shared/stores/authStore';

export default function LoginScreen() {
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [profileMissingBanner, setProfileMissingBanner] = useState(false);
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { identifier: '', password: '' },
  });

  useEffect(() => {
    if (useAuthStore.getState().loginFlash === 'profile_missing') {
      setProfileMissingBanner(true);
      setSubmitError(null);
      useAuthStore.getState().setLoginFlash(null);
    }
  }, []);

  const onSubmit = handleSubmit(async (values) => {
    setSubmitError(null);
    setProfileMissingBanner(false);
    try {
      await signInWithIdentifier(values.identifier, values.password);
      router.replace('/(app)');
    } catch (error) {
      setSubmitError(mapAuthError(error));
    }
  });

  return (
    <Screen scroll scrollContentContainerStyle={{ justifyContent: 'center' }}>
      <FadeInView>
        <AuthBrandingHeader headline="Welcome back" subtitle="Sign in." />

        <AppCard>
          <Controller
            control={control}
            name="identifier"
            render={({ field: { onChange, onBlur, value } }) => (
              <AppTextField
                label="Email, username, or phone"
                placeholder="you@email.com, username, or (555) 123-4567"
                autoCapitalize="none"
                autoComplete="username"
                keyboardType="default"
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
                errorMessage={errors.identifier?.message}
              />
            )}
          />
          <Controller
            control={control}
            name="password"
            render={({ field: { onChange, onBlur, value } }) => (
              <AppTextField
                label="Password"
                secureTextEntry
                autoCapitalize="none"
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
                errorMessage={errors.password?.message}
              />
            )}
          />

          <AppButton title="Sign in" loading={isSubmitting} onPress={onSubmit} />

          {profileMissingBanner ? (
            <View className="mt-5 w-full items-center px-1">
              <AppText
                variant="subtitle"
                className="text-center font-semibold"
                style={{ color: actsTheme.colors.danger }}>
                Profile not found
              </AppText>
              <AppText variant="body" className="mt-3 text-center leading-6 text-acts-ink">
                No profile found for this account. Try signing up again or contact support.
              </AppText>
            </View>
          ) : submitError ? (
            <AppText
              variant="body"
              className="mt-5 text-center leading-6"
              style={{ color: actsTheme.colors.danger }}>
              {submitError}
            </AppText>
          ) : null}

          <Link href="/(auth)/forgot-password" className="mt-4 self-center py-2">
            <AppText variant="caption" className="text-acts-blue">
              Forgot password?
            </AppText>
          </Link>

          {shouldShowGoogleAuthOnAuthScreens() ? (
            <>
              <AuthMethodDivider />
              <GoogleSignInSection intent="sign-in" />
            </>
          ) : null}
        </AppCard>

        <View className="mt-8 flex-row items-center justify-center gap-1">
          <AppText variant="caption">New here?</AppText>
          <Link href="/(auth)/signup" className="py-2">
            <AppText variant="caption" className="font-semibold text-acts-green">
              Create an account
            </AppText>
          </Link>
        </View>
      </FadeInView>
    </Screen>
  );
}
