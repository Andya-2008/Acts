import Ionicons from '@expo/vector-icons/Ionicons';
import type { User } from 'firebase/auth';
import { Image, Pressable, View } from 'react-native';

import { normalizeProfileBio } from '@/shared/constants/profileBio';
import { mergeActsDefaults } from '@/shared/types/actsSettings';
import type { UserInfoRead } from '@/shared/types/userInfo';
import { AppText } from '@/shared/components/ui';

import type { ServiceRankView } from '@/features/user-profile/config/xpServiceRanks';

type ProfileHeroSectionProps = {
  user: User | null;
  userInfo: UserInfoRead | null | undefined;
  streak: number;
  /** Seeds balance (same value as heart points in Firestore). */
  seeds: number;
  /** Lifetime XP (good deeds; monotonic). */
  lifetimeXp: number;
  actsCompleted: number;
  /** XP-based public “service rank” tagline. */
  serviceRank: ServiceRankView;
  showServiceRank?: boolean;
  showStreak?: boolean;
  showLifetimeXp?: boolean;
  showActsCompleted?: boolean;
  onPressSettings: () => void;
  onPressAchievements?: () => void;
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
  seeds,
  lifetimeXp,
  actsCompleted,
  serviceRank,
  showServiceRank = true,
  showStreak = true,
  showLifetimeXp = true,
  showActsCompleted = true,
  onPressSettings,
  onPressAchievements,
}: ProfileHeroSectionProps) {
  const name = displayNameFrom(user, userInfo);
  const handle = usernameLabel(userInfo);
  const uri = avatarUri(user, userInfo);
  const bioText = normalizeProfileBio(mergeActsDefaults(userInfo?.ActsSettings).bio);
  const { tier: rankTier, xpUntilNext, progressToNext } = serviceRank;

  return (
    <View className="relative">
      <View pointerEvents="none" className="absolute -right-8 -top-12 h-44 w-44 rounded-full bg-acts-blue/35" />
      <View pointerEvents="none" className="absolute -bottom-20 -left-12 h-56 w-56 rounded-full bg-acts-green-soft/45" />
      <View pointerEvents="none" className="absolute bottom-6 right-4 h-20 w-20 rounded-full bg-white/12" />

      <View className="px-5 pb-8 pt-3">
        <View className="mb-5 flex-row items-center justify-between">
          {onPressAchievements ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Open achievements"
              hitSlop={12}
              onPress={onPressAchievements}
              className="rounded-full bg-white/20 p-2.5 active:bg-white/30">
              <Ionicons name="trophy" size={22} color="#FFFFFF" />
            </Pressable>
          ) : (
            <View className="w-11" />
          )}
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
              <View
                className="h-full w-full items-center justify-center"
                accessibilityLabel="No profile photo">
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
            {bioText.length > 0 ? (
              <AppText
                variant="caption"
                paletteColor={false}
                className="mt-2 text-sm leading-5 text-white/90"
                numberOfLines={3}>
                {bioText}
              </AppText>
            ) : null}
            {showServiceRank ? (
              <>
                <View
                  accessibilityRole="text"
                  accessibilityLabel={`Service rank ${rankTier.label}. ${rankTier.tagline}${
                    xpUntilNext != null ? `. ${xpUntilNext} experience points until next rank` : '. Maximum rank'
                  }`}
                  className="mt-3 flex-row items-center gap-2 self-start rounded-2xl border border-white/40 bg-white/15 pl-3 pr-3 py-2">
                  <Ionicons name={rankTier.icon} size={20} color="#FFE8A3" />
                  <View className="min-w-0 flex-1">
                    <AppText variant="caption" paletteColor={false} className="font-bold text-white" numberOfLines={1}>
                      {rankTier.label}
                    </AppText>
                    <AppText variant="caption" paletteColor={false} className="text-[11px] text-white/80" numberOfLines={2}>
                      {rankTier.tagline}
                      {xpUntilNext != null ? ` · ${xpUntilNext} XP to next rank` : ' · Max rank'}
                    </AppText>
                  </View>
                </View>
                {xpUntilNext != null ? (
                  <View className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-white/20">
                    <View
                      className="h-full rounded-full bg-amber-200"
                      style={{ width: `${Math.round(progressToNext * 100)}%` }}
                    />
                  </View>
                ) : null}
              </>
            ) : null}
          </View>
        </View>

        <View className="mt-6 flex-row flex-wrap gap-2">
          {showStreak ? (
            <View
              accessibilityRole="text"
              accessibilityLabel={`${streak} day completion streak`}
              className="flex-row items-center gap-2 rounded-2xl border border-white/35 bg-white/20 px-3.5 py-2.5">
              <Ionicons name="flame" size={18} color="#FFB020" />
              <AppText variant="caption" paletteColor={false} className="font-semibold text-white">
                {streak} day streak
              </AppText>
            </View>
          ) : null}
          <View
            accessibilityRole="text"
            accessibilityLabel={`${seeds} seeds`}
            className="flex-row items-center gap-2 rounded-2xl border border-white/35 bg-white/20 px-3.5 py-2.5">
            <Ionicons name="leaf" size={18} color="#B8F5C8" />
            <AppText variant="caption" paletteColor={false} className="font-semibold text-white">
              {seeds} seeds
            </AppText>
          </View>
          {showLifetimeXp ? (
            <View
              accessibilityRole="text"
              accessibilityLabel={`${lifetimeXp} lifetime experience points`}
              className="flex-row items-center gap-2 rounded-2xl border border-white/35 bg-white/20 px-3.5 py-2.5">
              <Ionicons name="sparkles" size={18} color="#FFE8A3" />
              <AppText variant="caption" paletteColor={false} className="font-semibold text-white">
                {lifetimeXp} XP
              </AppText>
            </View>
          ) : null}
          {showActsCompleted ? (
            <View
              accessibilityRole="text"
              accessibilityLabel={`${actsCompleted} acts completed`}
              className="flex-row items-center gap-2 rounded-2xl border border-white/35 bg-white/20 px-3.5 py-2.5">
              <Ionicons name="checkmark-done" size={18} color="#C8D4FF" />
              <AppText variant="caption" paletteColor={false} className="font-semibold text-white">
                {actsCompleted} acts
              </AppText>
            </View>
          ) : null}
        </View>
      </View>
    </View>
  );
}
