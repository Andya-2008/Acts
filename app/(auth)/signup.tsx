import { zodResolver } from '@hookform/resolvers/zod';
import * as ImagePicker from 'expo-image-picker';
import { Link, router } from 'expo-router';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { Alert, Image, Platform, Pressable, View } from 'react-native';

import {
  completeEmailPasswordRegistration,
  createEmailPasswordAuthUser,
} from '@/features/auth/services/authService';
import { markPostSignupFriendsGatePending } from '@/features/friends/friendsGetStartedStorage';
import { AuthBrandingHeader } from '@/features/auth/components/AuthBrandingHeader';
import { AlternateSignInMethods } from '@/features/auth/components/AlternateSignInMethods';
import { shouldShowAppleAuthOnAuthScreens } from '@/shared/config/appleAuthEnv';
import { shouldShowGoogleAuthOnAuthScreens } from '@/shared/config/googleAuthEnv';
import { mapAuthError } from '@/features/auth/utils/mapAuthError';
import { signupSchema, type SignupFormValues } from '@/features/auth/validation/authSchemas';
import { AppButton, AppCard, AppText, AppTextField, FadeInView, Screen } from '@/shared/components/ui';
import { formatPhoneInput } from '@/shared/utils/formatPhoneInput';
import { actsTheme } from '@/shared/theme/actsTheme';

export default function SignupScreen() {
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      username: '',
      email: '',
      phone: '',
      password: '',
      birthdate: undefined,
      profilePhotoUri: undefined,
    },
  });

  const profilePhotoUri = watch('profilePhotoUri');
  const birthdate = watch('birthdate');
  const [showDatePicker, setShowDatePicker] = useState(false);

  const imagePickerOptions: ImagePicker.ImagePickerOptions = {
    mediaTypes: ['images'],
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.85,
  };

  const pickProfilePhotoFromLibrary = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setSubmitError('Photo library access is required to choose a profile picture.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync(imagePickerOptions);
    if (!result.canceled && result.assets[0]) {
      setSubmitError(null);
      setValue('profilePhotoUri', result.assets[0].uri, { shouldValidate: true });
    }
  };

  const takeProfilePhotoWithCamera = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      setSubmitError('Camera access is required to take a profile picture.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync(imagePickerOptions);
    if (!result.canceled && result.assets[0]) {
      setSubmitError(null);
      setValue('profilePhotoUri', result.assets[0].uri, { shouldValidate: true });
    }
  };

  const openProfilePhotoOptions = () => {
    setSubmitError(null);
    Alert.alert('Profile photo', 'Camera or library (optional).', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Take photo', onPress: () => void takeProfilePhotoWithCamera() },
      { text: 'Choose from library', onPress: () => void pickProfilePhotoFromLibrary() },
    ]);
  };

  const onBirthdateChange = (onChange: (date: Date) => void) => (event: DateTimePickerEvent, date?: Date) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
    if (event.type === 'set' && date) {
      onChange(date);
    }
  };

  const onSubmit = handleSubmit(async (values) => {
    setSubmitError(null);
    try {
      const user = await createEmailPasswordAuthUser(values.email, values.password);
      await completeEmailPasswordRegistration(user, values);
      await markPostSignupFriendsGatePending(user.uid);
      router.replace('/(app)');
    } catch (error) {
      setSubmitError(mapAuthError(error));
    }
  });

  return (
    <Screen scroll>
      <FadeInView>
        <View className="py-8">
        <AuthBrandingHeader headline="Create your account" subtitle="Email and password to get started." />

        <AppCard>
          <Pressable
            onPress={openProfilePhotoOptions}
            className="mb-6 items-center self-center rounded-full border border-dashed border-acts-border p-1">
            {profilePhotoUri ? (
              <Image source={{ uri: profilePhotoUri }} className="h-24 w-24 rounded-full" resizeMode="cover" />
            ) : (
              <View className="h-24 w-24 items-center justify-center rounded-full bg-acts-green-soft">
                <AppText variant="caption" className="text-center text-acts-green">
                  Profile photo{'\n'}(optional)
                </AppText>
              </View>
            )}
          </Pressable>

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
          <Controller
            control={control}
            name="phone"
            render={({ field: { onChange, onBlur, value } }) => (
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
                errorMessage={errors.phone?.message}
              />
            )}
          />
          <Controller
            control={control}
            name="username"
            render={({ field: { onChange, onBlur, value } }) => (
              <AppTextField
                label="Username (optional)"
                placeholder="Leave blank for an auto-generated username"
                autoCapitalize="none"
                autoCorrect={false}
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
                errorMessage={errors.username?.message}
              />
            )}
          />

          <View className="mb-4">
            <AppText variant="label" className="mb-1.5">
              Date of birth (optional)
            </AppText>
            {birthdate != null ? (
              <>
                {Platform.OS === 'android' ? (
                  <>
                    <AppButton
                      variant="secondary"
                      title="Change birthdate"
                      onPress={() => setShowDatePicker(true)}
                    />
                    {showDatePicker ? (
                      <Controller
                        control={control}
                        name="birthdate"
                        render={({ field: { value, onChange } }) => (
                          <DateTimePicker
                            value={value ?? new Date(2000, 5, 15)}
                            mode="date"
                            display="default"
                            maximumDate={new Date()}
                            onChange={onBirthdateChange(onChange)}
                          />
                        )}
                      />
                    ) : null}
                  </>
                ) : (
                  <Controller
                    control={control}
                    name="birthdate"
                    render={({ field: { value, onChange } }) => (
                      <DateTimePicker
                        value={value ?? new Date(2000, 5, 15)}
                        mode="date"
                        display="inline"
                        themeVariant="light"
                        maximumDate={new Date()}
                        onChange={onBirthdateChange(onChange)}
                      />
                    )}
                  />
                )}
                <AppButton
                  title="Remove birthdate"
                  variant="ghost"
                  className="mt-2 self-start"
                  onPress={() => {
                    setShowDatePicker(false);
                    setValue('birthdate', undefined, { shouldValidate: true });
                  }}
                />
              </>
            ) : (
              <AppButton
                variant="secondary"
                title="Add date of birth"
                onPress={() => {
                  setValue('birthdate', new Date(2000, 5, 15), { shouldValidate: true });
                  if (Platform.OS === 'android') {
                    setShowDatePicker(true);
                  }
                }}
              />
            )}
            {errors.birthdate?.message ? (
              <AppText variant="caption" className="mt-1 text-acts-danger">
                {errors.birthdate.message}
              </AppText>
            ) : null}
          </View>

          {submitError ? (
            <AppText
              variant="body"
              className="mb-4 text-center leading-6"
              style={{ color: actsTheme.colors.danger }}>
              {submitError}
            </AppText>
          ) : null}

          <AppButton title="Create account" loading={isSubmitting} onPress={onSubmit} />

          {shouldShowGoogleAuthOnAuthScreens() || shouldShowAppleAuthOnAuthScreens() ? (
            <AlternateSignInMethods intent="sign-up" />
          ) : null}
        </AppCard>

        <View className="mt-8 flex-row flex-wrap items-center justify-center gap-1">
          <AppText variant="caption">Already have an account?</AppText>
          <Link href="/(auth)/login" className="py-2">
            <AppText variant="caption" className="font-semibold text-acts-green">
              Sign in
            </AppText>
          </Link>
        </View>
        </View>
      </FadeInView>
    </Screen>
  );
}
