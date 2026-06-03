import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useState } from 'react';
import { Image, Platform, View } from 'react-native';

import { deleteAccount, signOutCurrentUser } from '@/features/auth/services/authService';
import { DeleteAccountConfirmModal } from '@/features/settings/components/DeleteAccountConfirmModal';
import { mapAuthError } from '@/features/auth/utils/mapAuthError';
import {
  useMergeActsSettingsMutation,
  useSaveProfilePictureMutation,
  useUpdateUserProfileBasicsMutation,
} from '@/features/user-profile/hooks/useUserInfoMutations';
import { useUserInfoQuery } from '@/features/user-profile/hooks/useUserInfoQuery';
import { userInfoQueryKeys } from '@/features/user-profile/queryKeys';
import { PROFILE_BIO_MAX_LENGTH, normalizeProfileBio } from '@/shared/constants/profileBio';
import { mergeActsDefaults } from '@/shared/types/actsSettings';
import { AppButton, AppText, AppTextField, Screen, TitleWithInfo } from '@/shared/components/ui';
import { useActAppearance } from '@/shared/providers/ActAppearanceProvider';
import { useAuthStore } from '@/shared/stores/authStore';

export default function SettingsAccountScreen() {
  const act = useActAppearance();
  const queryClient = useQueryClient();
  const uid = useAuthStore((s) => s.user?.uid);
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
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
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  const avatarUri = userInfo?.profilePicUrl?.trim() || user?.photoURL || null;
  const username = userInfo?.Username?.trim() ?? '';

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
      bio: normalizeProfileBio(bio),
    });
  };

  const runDeleteAccount = async () => {
    setDeleteError(null);
    setDeleteBusy(true);
    try {
      await deleteAccount();
      setDeleteConfirmOpen(false);
      setUser(null);
      queryClient.removeQueries({ queryKey: userInfoQueryKeys.all });
      router.replace('/(auth)/login');
    } catch (e) {
      const msg = mapAuthError(e);
      setDeleteError(msg);
    } finally {
      setDeleteBusy(false);
    }
  };

  const openDeleteConfirm = () => {
    setDeleteError(null);
    if (!username) {
      setDeleteError('Your account is missing a username. Contact support before deleting.');
      return;
    }
    setDeleteConfirmOpen(true);
  };

  const closeDeleteConfirm = () => {
    if (!deleteBusy) {
      setDeleteConfirmOpen(false);
    }
  };

  const handleLogout = async () => {
    queryClient.removeQueries({ queryKey: userInfoQueryKeys.all });
    await signOutCurrentUser();
    router.replace('/(auth)/login');
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
                <Ionicons name="person" size={48} color={act.palette.muted} accessibilityLabel="No profile photo" />
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
              accessibilityLabel="Choose profile photo from library"
              onPress={() => void pickFromLibrary()}
            />
            <AppButton
              title="Take photo"
              variant="secondary"
              className="min-w-[44%] flex-1"
              disabled={saveProfilePic.isPending}
              accessibilityLabel="Take a new profile photo"
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
        <TitleWithInfo
          title="Bio"
          variant="subtitle"
          className="mb-2"
          infoText="Your bio is always public on your profile, including to people who are not your friends."
        />
        <AppTextField
          value={bio}
          onChangeText={(t) => setBio(t.slice(0, PROFILE_BIO_MAX_LENGTH))}
          placeholder="Short intro (public on your profile)"
          multiline
          numberOfLines={3}
          maxLength={PROFILE_BIO_MAX_LENGTH}
          textAlignVertical="top"
          className="min-h-[88px]"
        />
        <AppText variant="caption" className="mb-4 mt-1 text-acts-muted">
          {bio.length}/{PROFILE_BIO_MAX_LENGTH}
        </AppText>

        <AppButton
          title="Save"
          loading={busy}
          disabled={busy}
          accessibilityLabel="Save account details"
          onPress={() => void save()}
          className="mb-3"
        />
        <AppButton
          title="Log out"
          variant="secondary"
          className="mb-3"
          accessibilityLabel="Log out of Acts"
          onPress={() => void handleLogout()}
        />

        <View className="mt-10 rounded-2xl border border-acts-danger/35 bg-acts-danger/5 px-4 py-4">
          <TitleWithInfo
            title="Delete account"
            variant="subtitle"
            className="mb-3"
            infoText="Permanently removes your profile, tasks, friends, deed posts, photos, and sign-in. You will be signed out. If deletion fails, sign in again and retry (some accounts require a recent sign-in)."
          />
          {deleteError ? (
            <AppText variant="caption" className="mb-3 text-acts-danger">
              {deleteError}
            </AppText>
          ) : null}
          <AppButton
            title="Delete my account"
            variant="dangerOutline"
            loading={deleteBusy}
            disabled={deleteBusy || !uid || !username}
            accessibilityLabel="Delete my Acts account permanently"
            onPress={openDeleteConfirm}
          />
        </View>
      </View>

      <DeleteAccountConfirmModal
        visible={deleteConfirmOpen}
        username={username}
        busy={deleteBusy}
        onClose={closeDeleteConfirm}
        onConfirmDelete={() => void runDeleteAccount()}
      />
    </Screen>
  );
}
