import { zodResolver } from '@hookform/resolvers/zod';
import { FirebaseRecaptchaVerifierModal } from 'expo-firebase-recaptcha';
import type { ConfirmationResult, User } from 'firebase/auth';
import { useRef, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Platform, View } from 'react-native';

import {
  confirmSmsVerificationCode,
  sendSmsVerificationCode,
  syncVerifiedPhoneToUserProfile,
} from '@/features/auth/services/phoneVerificationService';
import { mapAuthError } from '@/features/auth/utils/mapAuthError';
import {
  phoneVerificationCodeSchema,
  type PhoneVerificationCodeFormValues,
} from '@/features/auth/validation/authSchemas';
import { AppButton, AppText, AppTextField } from '@/shared/components/ui';
import { getFirebaseWebConfig } from '@/shared/config/env';
import { useAuthStore } from '@/shared/stores/authStore';

type PhoneSmsVerificationFormProps = {
  user: User;
  phoneDisplay: string;
  headline?: string;
  subtitle?: string;
  /** When true, writes Phone to Firestore after a successful code confirmation. */
  syncProfile?: boolean;
  onVerified: () => void | Promise<void>;
  onCancel?: () => void;
};

export function PhoneSmsVerificationForm({
  user,
  phoneDisplay,
  headline = 'Verify your number',
  subtitle = 'We will text you a 6-digit code to confirm this mobile number.',
  syncProfile = true,
  onVerified,
  onCancel,
}: PhoneSmsVerificationFormProps) {
  const recaptchaRef = useRef<FirebaseRecaptchaVerifierModal>(null);
  const setUser = useAuthStore((s) => s.setUser);
  const [step, setStep] = useState<'send' | 'confirm'>('send');
  const [confirmation, setConfirmation] = useState<ConfirmationResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<PhoneVerificationCodeFormValues>({
    resolver: zodResolver(phoneVerificationCodeSchema),
    defaultValues: { code: '' },
  });

  if (Platform.OS === 'web') {
    return (
      <View className="gap-3">
        <AppText variant="body" className="text-center leading-6 text-acts-muted">
          Phone verification requires the Acts iOS or Android app. Open Acts on your phone to finish
          setting up your account.
        </AppText>
        {onCancel ? <AppButton title="Go back" variant="secondary" onPress={onCancel} /> : null}
      </View>
    );
  }

  const sendCode = async () => {
    setError(null);
    setBusy(true);
    try {
      const verifier = recaptchaRef.current;
      if (!verifier) {
        throw new Error('PHONE_RECAPTCHA_NOT_READY');
      }
      const result = await sendSmsVerificationCode(user, phoneDisplay, verifier);
      setConfirmation(result);
      setStep('confirm');
    } catch (e) {
      setError(mapAuthError(e));
    } finally {
      setBusy(false);
    }
  };

  const confirmCode = handleSubmit(async ({ code }) => {
    if (!confirmation) {
      setError('Send a verification code first.');
      return;
    }
    setError(null);
    setBusy(true);
    try {
      const verifiedUser = await confirmSmsVerificationCode(confirmation, code);
      setUser(verifiedUser);
      if (syncProfile) {
        await syncVerifiedPhoneToUserProfile(verifiedUser.uid, phoneDisplay);
      }
      await onVerified();
    } catch (e) {
      setError(mapAuthError(e));
    } finally {
      setBusy(false);
    }
  });

  return (
    <View className="gap-4">
      <AppText variant="subtitle" className="text-center">
        {headline}
      </AppText>
      <AppText variant="body" className="text-center leading-6 text-acts-muted">
        {subtitle}
      </AppText>
      <AppTextField label="Mobile number" value={phoneDisplay} editable={false} />

      {step === 'send' ? (
        <AppButton title="Send verification code" loading={busy} onPress={() => void sendCode()} />
      ) : (
        <>
          <Controller
            control={control}
            name="code"
            render={({ field: { onChange, onBlur, value } }) => (
              <AppTextField
                label="Verification code"
                placeholder="6-digit code"
                keyboardType="number-pad"
                textContentType="oneTimeCode"
                autoComplete="sms-otp"
                maxLength={6}
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
                errorMessage={errors.code?.message}
              />
            )}
          />
          <AppButton title="Confirm code" loading={busy} onPress={() => void confirmCode()} />
          <AppButton
            title="Resend code"
            variant="ghost"
            disabled={busy}
            onPress={() => {
              setStep('send');
              setConfirmation(null);
              void sendCode();
            }}
          />
        </>
      )}

      {error ? (
        <AppText variant="caption" className="text-center text-acts-danger">
          {error}
        </AppText>
      ) : null}

      {onCancel ? (
        <AppButton title="Cancel" variant="secondary" disabled={busy} onPress={onCancel} />
      ) : null}

      <FirebaseRecaptchaVerifierModal
        ref={recaptchaRef}
        firebaseConfig={getFirebaseWebConfig()}
        attemptInvisibleVerification
      />
    </View>
  );
}
