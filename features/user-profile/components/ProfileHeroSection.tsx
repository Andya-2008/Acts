import Ionicons from '@expo/vector-icons/Ionicons';
import type { User } from 'firebase/auth';
import { Image, Pressable, View } from 'react-native';

import type { UserInfoRead } from '@/shared/types/userInfo';
import { AppText } from '@/shared/components/ui';

type ProfileHeroSectionProps = {
  user: User | null;
  userInfo: UserInfoRead | null | undefined;
  streak: number;
  kindnessPoints: number;
  actsCompleted: number;
  onPressSettings: () => void;
};

function displayNameFrom(user: User | null, userInfo: UserInfoRead | null | undefined): string {
  const fromProfile = [userInfo?.First, userInfo?.Last].filter(Boolean).join(' ').trim();
  if (fromProfile.length > 0) {
    return fromProfile;
  }
  return user?.displayName?.trim() || 'Friend';
}

function usernameLabel(userInfo: UserInfoRead | null | undefined): string | null {
  const raw = userInfo?.Username?.trim();
  if (!raw) {
    return null;
  }
  const handle = raw.replace(/^@+/, '');
  return `@${handle}`;
}

function avatarUri(user: User | null, userInfo: UserInfoRead | null | undefined): string | null {
  return userInfo?.profilePicUrl ?? user?.photoURL ?? null;
}

export function ProfileHeroSection({
  user,
  userInfo,
  streak,
  kindnessPoints,
  actsCompleted,
  onPressSettings,
}: ProfileHeroSectionProps) {
  const name = displayNameFrom(user, userInfo);
  const handle = usernameLabel(userInfo);
  const uri = avatarUri(user, userInfo);

  return (
    <View className="relative">
      <View pointerEvents="none" className="absolute -right-8 -top-12 h-44 w-44 rounded-full bg-acts-blue/35" />
      <View pointerEvents="none" className="absolute -bottom-20 -left-12 h-56 w-56 rounded-full bg-acts-green-soft/45" />
      <View pointerEvents="none" className="absolute bottom-6 right-4 h-20 w-20 rounded-full bg-white/12" />

      <View className="px-5 pb-8 pt-3">
        <View className="mb-5 flex-row items-center justify-end">
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Open settings"
            hitSlop={12}
            onPress={onPressSettings}
            className="rounded-full bg-white/20 p-2.5 active:bg-white/30">
            <Ionicons name="settings-outline" size={22} color="#FFFFFF" />
          </Pressable>
        </View>

        <View className="flex-row items-center gap-4">
          <View className="h-[104px] w-[104px] overflow-hidden rounded-[28px] border-[3px] border-white/90 bg-white/15">
            {uri ? (
              <Image source={{ uri }} className="h-full w-full" accessibilityLabel="Profile photo" />
            ) : (
              <View className="h-full w-full items-center justify-center">
                <Ionicons name="person" size={48} color="rgba(255,255,255,0.88)" />
              </View>
            )}
          </View>
          <View className="min-w-0 flex-1">
            <AppText
              variant="title"
              paletteColor={false}
              className="text-[26px] font-bold text-white"
              numberOfLines={2}>
              {name}
            </AppText>
            {handle ? (
              <AppText
                variant="subtitle"
                paletteColor={false}
                className="mt-1 text-base text-white/90"
                numberOfLines={1}>
                {handle}
              </AppText>
            ) : (
              <AppText variant="caption" paletteColor={false} className="mt-1.5 text-white/80">
                Add a username when you personalize
              </AppText>
            )}
          </View>
        </View>

        <View className="mt-6 flex-row flex-wrap gap-2">
          <View className="flex-row items-center gap-2 rounded-2xl border border-white/35 bg-white/20 px-3.5 py-2.5">
            <Ionicons name="flame" size={18} color="#FFB020" />
            <AppText variant="caption" paletteColor={false} className="font-semibold text-white">
              {streak} day streak
            </AppText>
          </View>
          <View className="flex-row items-center gap-2 rounded-2xl border border-white/35 bg-white/20 px-3.5 py-2.5">
            <Ionicons name="heart" size={18} color="#FFD0E8" />
            <AppText variant="caption" paletteColor={false} className="font-semibold text-white">
              {kindnessPoints} hearts
            </AppText>
          </View>
          <View className="flex-row items-center gap-2 rounded-2xl border border-white/35 bg-white/20 px-3.5 py-2.5">
            <Ionicons name="checkmark-done" size={18} color="#C8D4FF" />
            <AppText variant="caption" paletteColor={false} className="font-semibold text-white">
              {actsCompleted} acts
            </AppText>
          </View>
        </View>
      </View>
    </View>
  );
}
