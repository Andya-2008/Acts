import { router, type Href } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useCallback, useEffect, useState } from 'react';
import { Image, Platform, View } from 'react-native';

import { mapAuthError } from '@/features/auth/utils/mapAuthError';
import {
  useMergeActsSettingsMutation,
  useSaveProfilePictureMutation,
  useUpdateUserProfileBasicsMutation,
} from '@/features/user-profile/hooks/useUserInfoMutations';
import { useUserInfoQuery } from '@/features/user-profile/hooks/useUserInfoQuery';
import { mergeActsDefaults } from '@/shared/types/actsSettings';
import { AppButton, AppText, AppTextField, Screen } from '@/shared/components/ui';
import { useAuthStore } from '@/shared/stores/authStore';

const BIO_MAX_LEN = 500;

export default function SettingsAccountScreen() {
  const uid = useAuthStore((s) => s.user?.uid);
  const user = useAuthStore((s) => s.user);
  const { data: userInfo } = useUserInfoQuery(uid);
  const mergeSettings = useMergeActsSettingsMutation(uid);
  const updateBasics = useUpdateUserProfileBasicsMutation(uid);
  const saveProfilePic = useSaveProfilePictureMutation(uid);

  const [first, setFirst] = useState('');
  const [last, setLast] = useState('');
  const [phone, setPhone] = useState('');
  const [dob, setDob] = useState('');
  const [title, setTitle] = useState('');
  const [cityState, setCityState] = useState('');
  const [bio, setBio] = useState('');
  const [photoError, setPhotoError] = useState<string | null>(null);

  const avatarUri = userInfo?.profilePicUrl?.trim() || user?.photoURL || null;

  useEffect(() => {
    if (!userInfo) {
      return;
    }
    setFirst(userInfo.First ?? '');
    setLast(userInfo.Last ?? '');
    setPhone(userInfo.Phone ?? '');
    setDob(userInfo.DOB ?? '');
    const merged = mergeActsDefaults(userInfo.ActsSettings);
    setTitle(merged.profileTitle ?? '');
    setCityState(merged.cityState ?? '');
    setBio(merged.bio ?? '');
  }, [userInfo]);

  const uploadPicked = useCallback(
    (uri: string | undefined) => {
      if (!uri || !uid) {
        return;
      }
      setPhotoError(null);
      saveProfilePic.mutate(uri, {
        onError: (e) => setPhotoError(mapAuthError(e)),
      });
    },
    [uid, saveProfilePic],
  );

  const pickFromLibrary = useCallback(async () => {
    if (Platform.OS === 'web') {
      setPhotoError('Profile photos can be updated from the iOS or Android app.');
      return;
    }
    setPhotoError(null);
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      setPhotoError('Photo library access was denied. You can enable it in system settings.');
      return;
    }
    const picked = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.88,
    });
    if (picked.canceled) {
      return;
    }
    uploadPicked(picked.assets[0]?.uri);
  }, [uploadPicked]);

  const pickFromCamera = useCallback(async () => {
    if (Platform.OS === 'web') {
      setPhotoError('Profile photos can be updated from the iOS or Android app.');
      return;
    }
    setPhotoError(null);
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      setPhotoError('Camera access was denied. You can enable it in system settings.');
      return;
    }
    const picked = await ImagePicker.launchCameraAsync({ quality: 0.88 });
    if (picked.canceled) {
      return;
    }
    uploadPicked(picked.assets[0]?.uri);
  }, [uploadPicked]);

  const save = async () => {
    if (!uid) {
      return;
    }
    await updateBasics.mutateAsync({
      First: first.trim(),
      Last: last.trim(),
      Phone: phone.trim(),
      DOB: dob.trim(),
    });
    await mergeSettings.mutateAsync({
      profileTitle: title.trim(),
      cityState: cityState.trim(),
      bio: bio.trim().slice(0, BIO_MAX_LEN),
    });
  };

  const busy = updateBasics.isPending || mergeSettings.isPending;

  return (
    <Screen scroll>
      <View className="pb-8">
        <AppText variant="subtitle" className="mb-3 text-acts-ink">
          Profile picture
        </AppText>
        <View className="mb-6 items-center rounded-2xl border border-acts-border/70 bg-acts-surface px-4 py-5">
          <View className="mb-4 h-28 w-28 overflow-hidden rounded-full border-2 border-acts-border bg-acts-canvas">
            {avatarUri ? (
              <Image source={{ uri: avatarUri }} className="h-full w-full" resizeMode="cover" />
            ) : (
              <View className="h-full w-full items-center justify-center">
                <Ionicons name="person" size={48} color="#8B6F82" accessibilityLabel="No profile photo" />
              </View>
            )}
          </View>
          <View className="w-full flex-row flex-wrap justify-center gap-2">
            <AppButton
              title="Photo library"
              variant="secondary"
              className="min-w-[44%] flex-1"
              disabled={saveProfilePic.isPending}
              loading={saveProfilePic.isPending}
              onPress={() => void pickFromLibrary()}
            />
            <AppButton
              title="Take photo"
              variant="secondary"
              className="min-w-[44%] flex-1"
              disabled={saveProfilePic.isPending}
              onPress={() => void pickFromCamera()}
            />
          </View>
          {photoError ? (
            <AppText variant="caption" className="mt-3 text-center text-acts-danger">
              {photoError}
            </AppText>
          ) : null}
          {Platform.OS === 'web' ? (
            <AppText variant="caption" className="mt-2 text-center text-acts-muted">
              Change your photo in the mobile app.
            </AppText>
          ) : null}
        </View>

        <AppText variant="subtitle" className="mb-3 text-acts-ink">
          Account details
        </AppText>
        <AppTextField label="Username" value={userInfo?.Username ?? ''} editable={false} />
        <AppTextField label="Email" value={user?.email ?? ''} editable={false} />
        <AppTextField label="Phone Number" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
        <AppTextField label="First Name" value={first} onChangeText={setFirst} />
        <AppTextField label="Last Name" value={last} onChangeText={setLast} />
        <AppTextField label="Birthday" value={dob} onChangeText={setDob} placeholder="MM/DD/YYYY" />
        <AppTextField label="Title" value={title} onChangeText={setTitle} placeholder="Optional" />
        <AppTextField label="City/State" value={cityState} onChangeText={setCityState} placeholder="Optional" />
        <AppTextField
          label="Bio"
          value={bio}
          onChangeText={(t) => setBio(t.slice(0, BIO_MAX_LEN))}
          placeholder="About you"
          multiline
          numberOfLines={5}
          textAlignVertical="top"
          className="min-h-[120px] py-3"
        />
        <AppText variant="caption" className="-mt-2 mb-4 text-acts-muted">
          {bio.length}/{BIO_MAX_LEN}
        </AppText>

        <AppButton title="Save" loading={busy} disabled={busy} onPress={() => void save()} className="mb-3" />
        <AppButton title="Become path" variant="secondary" onPress={() => router.push('/(app)/become' as Href)} />
      </View>
    </Screen>
  );
}
