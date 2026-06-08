import { zodResolver } from '@hookform/resolvers/zod';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Platform, View } from 'react-native';

import { PhoneSmsVerificationForm } from '@/features/auth/components/PhoneSmsVerificationForm';
import { verifiedPhoneDisplay } from '@/features/auth/services/phoneVerificationService';
import { requiredActsPhoneSchema } from '@/features/auth/validation/authSchemas';
import { useUserInfoQuery } from '@/features/user-profile/hooks/useUserInfoQuery';
import { AppButton, AppCard, AppText, AppTextField, FadeInView, Screen } from '@/shared/components/ui';
import { formatPhoneInput } from '@/shared/utils/formatPhoneInput';
import { useAuthStore } from '@/shared/stores/authStore';
import { z } from 'zod';

type PhoneEntryValues = {
  phone: string;
};

export default function VerifyPhoneScreen() {
  const user = useAuthStore((s) => s.user);
  const { data: userInfo } = useUserInfoQuery(user?.uid);
  const [step, setStep] = useState<'enter' | 'verify'>('enter');

  const {
    control,
    handleSubmit,
    getValues,
    setValue,
    formState: { errors },
  } = useForm<PhoneEntryValues>({
    resolver: zodResolver(z.object({ phone: requiredActsPhoneSchema })),
    defaultValues: { phone: '' },
  });

  useEffect(() => {
    const fromAuth = user ? verifiedPhoneDisplay(user) : '';
    const fromProfile = formatPhoneInput(String(userInfo?.Phone ?? '').trim());
    const prefill = fromAuth || fromProfile;
    if (prefill) {
      setValue('phone', prefill);
    }
  }, [user, userInfo?.Phone, setValue]);

  if (!user) {
    return null;
  }

  const startVerification = handleSubmit(() => {
    setStep('verify');
  });

  if (step === 'verify') {
    const phoneDisplay = getValues('phone');
    return (
      <Screen scroll>
        <FadeInView>
          <View className="py-8">
            <AppCard>
              <PhoneSmsVerificationForm
                user={user}
                phoneDisplay={phoneDisplay}
                headline="Verify your mobile number"
                subtitle="Acts uses your number for sign-in and friend matching. We will text you a 6-digit code."
                onVerified={() => {
                  router.replace('/(app)');
                }}
              />
            </AppCard>
          </View>
        </FadeInView>
      </Screen>
    );
  }

  return (
    <Screen scroll>
      <FadeInView>
        <View className="py-8">
          <AppText variant="title" className="mb-2 text-center">
            Mobile number required
          </AppText>
          <AppText variant="body" className="mb-6 text-center leading-6 text-acts-muted">
            {Platform.OS === 'web'
              ? 'Open Acts on your phone to verify your mobile number and continue.'
              : 'Enter your mobile number. We will send a text message with a verification code.'}
          </AppText>

          <AppCard>
            <Controller
              control={control}
              name="phone"
              render={({ field: { onChange, onBlur, value } }) => (
                <AppTextField
                  label="Mobile number"
                  placeholder="e.g. (555) 123-4567"
                  keyboardType="phone-pad"
                  textContentType="telephoneNumber"
                  autoComplete="tel"
                  onBlur={onBlur}
                  onChangeText={(t) => onChange(formatPhoneInput(t))}
                  value={value}
                  maxLength={14}
                  errorMessage={errors.phone?.message}
                />
              )}
            />
            <AppButton title="Continue" onPress={() => void startVerification()} />
          </AppCard>
        </View>
      </FadeInView>
    </Screen>
  );
}
