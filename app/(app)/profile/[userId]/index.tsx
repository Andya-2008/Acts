import { router, Stack, useLocalSearchParams, type Href } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Image, Pressable, Text as RNText, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';

import { mapAuthError } from '@/features/auth/utils/mapAuthError';
import {
  useAcceptFriendRequestMutation,
  useCancelOutgoingFriendRequestMutation,
  useDeclineFriendRequestMutation,
  useFriendshipRelationQuery,
  useMutualFriendsQuery,
  useSendFriendRequestToUidMutation,
} from '@/features/friends/hooks/useFriendsQueries';
import type { MutualFriendSummary } from '@/features/friends/services/friendsRepository';
import { useUserInfoQuery } from '@/features/user-profile/hooks/useUserInfoQuery';
import { mergeActsDefaults } from '@/shared/types/actsSettings';
import type { UserInfoRead } from '@/shared/types/userInfo';
import { AppButton, AppCard, AppText, Screen } from '@/shared/components/ui';
import { useAuthStore } from '@/shared/stores/authStore';

function paramUid(raw: string | string[] | undefined): string {
  if (typeof raw === 'string') {
    return raw.trim();
  }
  if (Array.isArray(raw) && raw[0]) {
    return String(raw[0]).trim();
  }
  return '';
}

function displayName(info: UserInfoRead | null | undefined): string {
  const full = [info?.First, info?.Last].filter(Boolean).join(' ').trim();
  if (full.length > 0) {
    return full;
  }
  const u = info?.Username?.trim();
  if (u) {
    return `@${u.replace(/^@+/, '')}`;
  }
  return 'Acts member';
}

function ProfileStackBackButton() {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Back"
      hitSlop={12}
      onPress={() => {
        if (router.canGoBack()) {
          router.back();
        } else {
          router.replace('/(app)/(tabs)/profile' as Href);
        }
      }}
      className="-ml-1 rounded-lg p-1 active:opacity-70">
      <Ionicons name="chevron-back" size={28} color="#2D1528" />
    </Pressable>
  );
}

const MUTUAL_AVATAR = 32;
const MUTUAL_AVATAR_OVERLAP = 10;

function MutualFriendsInstagramRow({ mutuals }: { mutuals: MutualFriendSummary[] }) {
  if (mutuals.length === 0) {
    return null;
  }

  const avatarStack = mutuals.slice(0, 3);
  const first = mutuals[0];
  const second = mutuals[1];
  const moreCount = mutuals.length > 2 ? mutuals.length - 2 : 0;

  const open = (uid: string) => {
    router.push(`/(app)/profile/${uid}` as Href);
  };

  return (
    <View
      className="mb-6 flex-row items-center gap-3 px-0.5"
      accessibilityRole="text"
      accessibilityLabel={`Mutual friends with ${mutuals.map((m) => m.boldHandle).join(', ')}`}>
      <View className="flex-row items-center" style={{ paddingRight: 4 }}>
        {avatarStack.map((m, i) => (
          <Pressable
            key={m.friendUid}
            accessibilityRole="button"
            accessibilityLabel={`Open profile ${m.displayName}`}
            onPress={() => open(m.friendUid)}
            style={{
              marginLeft: i === 0 ? 0 : -MUTUAL_AVATAR_OVERLAP,
              zIndex: avatarStack.length - i,
            }}>
            <View
              className="items-center justify-center overflow-hidden rounded-full border-2 border-white bg-acts-canvas"
              style={{ width: MUTUAL_AVATAR, height: MUTUAL_AVATAR }}>
              {m.profilePicUrl ? (
                <Image source={{ uri: m.profilePicUrl }} className="h-full w-full" resizeMode="cover" />
              ) : (
                <Ionicons name="person" size={18} color="#8B6F82" />
              )}
            </View>
          </Pressable>
        ))}
      </View>
      <RNText className="min-w-0 flex-1 text-[14px] leading-5 text-acts-ink" numberOfLines={3}>
        <RNText>Mutual friends with </RNText>
        <RNText onPress={() => open(first.friendUid)} style={{ fontWeight: '700' }}>
          {first.boldHandle}
        </RNText>
        {second ? (
          <>
            <RNText>, </RNText>
            <RNText onPress={() => open(second.friendUid)} style={{ fontWeight: '700' }}>
              {second.boldHandle}
            </RNText>
          </>
        ) : null}
        {moreCount > 0 ? (
          <RNText style={{ fontWeight: '400' }}>{` +${moreCount} more`}</RNText>
        ) : null}
      </RNText>
    </View>
  );
}

function ChipRow({ label, items }: { label: string; items: string[] }) {
  const list = items.map((s) => s.trim()).filter(Boolean);
  if (list.length === 0) {
    return null;
  }
  return (
    <AppCard className="mb-4 p-4">
      <AppText variant="subtitle" className="mb-2 text-acts-ink">
        {label}
      </AppText>
      <View className="flex-row flex-wrap gap-2">
        {list.map((t, i) => (
          <View key={`${label}-${i}-${t}`} className="rounded-full border border-acts-border/70 bg-acts-canvas px-3 py-1.5">
            <AppText variant="caption" className="text-acts-ink">
              {t}
            </AppText>
          </View>
        ))}
      </View>
    </AppCard>
  );
}

export default function PublicProfileScreen() {
  const { userId: userIdRaw } = useLocalSearchParams<{ userId: string }>();
  const profileUid = useMemo(() => paramUid(userIdRaw), [userIdRaw]);
  const myUid = useAuthStore((s) => s.user?.uid);

  const { data: profile, isPending: profilePending, isError, error } = useUserInfoQuery(profileUid || undefined);
  const relationQuery = useFriendshipRelationQuery(myUid, profileUid || undefined);
  const acceptMutation = useAcceptFriendRequestMutation(myUid);
  const declineMutation = useDeclineFriendRequestMutation(myUid);
  const cancelMutation = useCancelOutgoingFriendRequestMutation(myUid);
  const sendToUidMutation = useSendFriendRequestToUidMutation(myUid);

  const [localError, setLocalError] = useState<string | null>(null);

  const acts = mergeActsDefaults(profile?.ActsSettings);
  const allowsRequests = acts.allowFriendRequests !== false;
  const relation = relationQuery.data;
  const relationActionsReady = profileUid === myUid || relationQuery.isFetched;
  const bioText = acts.bio.trim();

  const avatarUri = profile?.profilePicUrl?.trim() || null;
  const handle = profile?.Username?.trim() ? `@${profile.Username.replace(/^@+/, '')}` : null;

  const mutualFriendsQuery = useMutualFriendsQuery(myUid, profileUid, relation);

  const busy =
    acceptMutation.isPending ||
    declineMutation.isPending ||
    cancelMutation.isPending ||
    sendToUidMutation.isPending;

  const onAccept = useCallback(() => {
    setLocalError(null);
    acceptMutation.mutate(profileUid, {
      onError: (e) => setLocalError(mapAuthError(e)),
    });
  }, [acceptMutation, profileUid]);

  const onDecline = useCallback(() => {
    setLocalError(null);
    declineMutation.mutate(profileUid, {
      onError: (e) => setLocalError(mapAuthError(e)),
    });
  }, [declineMutation, profileUid]);

  const onCancelRequest = useCallback(() => {
    setLocalError(null);
    cancelMutation.mutate(profileUid, {
      onError: (e) => setLocalError(mapAuthError(e)),
    });
  }, [cancelMutation, profileUid]);

  const onAddFriend = useCallback(() => {
    setLocalError(null);
    sendToUidMutation.mutate(profileUid, {
      onError: (e) => setLocalError(mapAuthError(e)),
    });
  }, [sendToUidMutation, profileUid]);

  if (!profileUid) {
    return (
      <>
        <Stack.Screen options={{ title: 'Profile', headerLeft: () => <ProfileStackBackButton /> }} />
        <Screen>
          <AppText variant="body">Missing profile.</AppText>
        </Screen>
      </>
    );
  }

  if (isError) {
    return (
      <>
        <Stack.Screen options={{ title: 'Profile', headerLeft: () => <ProfileStackBackButton /> }} />
        <Screen>
          <AppText variant="body" className="text-acts-danger">
            {mapAuthError(error)}
          </AppText>
        </Screen>
      </>
    );
  }

  if (profilePending || !profile) {
    return (
      <>
        <Stack.Screen options={{ title: 'Profile', headerLeft: () => <ProfileStackBackButton /> }} />
        <Screen>
          <View className="items-center py-16">
            <ActivityIndicator size="large" color="#E11D74" />
          </View>
        </Screen>
      </>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: displayName(profile),
          headerLeft: () => <ProfileStackBackButton />,
        }}
      />
      <Screen scroll>
      <View className="items-center border-b border-acts-border/50 pb-6 pt-2">
        <View className="mb-4 h-28 w-28 overflow-hidden rounded-full border-2 border-acts-border bg-acts-canvas">
          {avatarUri ? (
            <Image source={{ uri: avatarUri }} className="h-full w-full" resizeMode="cover" />
          ) : (
            <View className="h-full w-full items-center justify-center">
              <Ionicons name="person" size={52} color="#8B6F82" />
            </View>
          )}
        </View>
        <AppText variant="title" className="mb-1 text-center text-acts-ink">
          {displayName(profile)}
        </AppText>
        {handle ? (
          <AppText variant="subtitle" className="text-acts-muted">
            {handle}
          </AppText>
        ) : null}
        {bioText.length > 0 ? (
          <View className="mt-4 w-full max-w-md self-stretch px-1">
            <AppText variant="caption" className="mb-1.5 text-acts-muted">
              Bio
            </AppText>
            <AppText variant="body" className="text-left text-acts-ink">
              {bioText}
            </AppText>
          </View>
        ) : null}
      </View>

      {localError ? (
        <AppText variant="caption" className="mb-3 mt-4 text-acts-danger">
          {localError}
        </AppText>
      ) : null}

      <View className="mt-6 gap-3">
        {!relationActionsReady ? (
          <View className="items-center py-6">
            <ActivityIndicator size="small" color="#E11D74" />
          </View>
        ) : null}

        {relationActionsReady && relation === 'self' ? (
          <AppButton title="Edit profile & photo" onPress={() => router.push('/(app)/settings/account' as Href)} />
        ) : null}

        {relationActionsReady && relation === 'incoming_pending' ? (
          <View className="gap-2">
            <View className="flex-row flex-wrap gap-2">
              <AppButton title="Decline" variant="secondary" className="min-w-[44%] flex-1" disabled={busy} onPress={onDecline} />
              <AppButton title="Accept" className="min-w-[44%] flex-1" disabled={busy} onPress={onAccept} />
            </View>
          </View>
        ) : null}

        {relationActionsReady && relation === 'outgoing_pending' ? (
          <View className="gap-2">
            <AppButton title="Cancel request" variant="secondary" disabled={busy} onPress={onCancelRequest} />
          </View>
        ) : null}

        {relationActionsReady && relation === 'none' ? (
          allowsRequests ? (
            <AppButton title="Add friend" disabled={busy} loading={sendToUidMutation.isPending} onPress={onAddFriend} />
          ) : (
            <AppText variant="body" className="text-acts-muted">
              Not accepting requests.
            </AppText>
          )
        ) : null}
      </View>

      {relationActionsReady && relation === 'friends' ? (
        <View className="mt-8 border-t border-acts-border/60 pt-6">
          {myUid && profileUid !== myUid && mutualFriendsQuery.isSuccess && (mutualFriendsQuery.data?.length ?? 0) > 0 ? (
            <MutualFriendsInstagramRow mutuals={mutualFriendsQuery.data!} />
          ) : null}

          <AppText variant="subtitle" className="mb-1 text-acts-ink">
            About them
          </AppText>

          {(acts.profileTitle || acts.cityState) && (
            <AppCard className="mb-4 p-4">
              {acts.profileTitle ? (
                <View className="mb-2">
                  <AppText variant="caption" className="text-acts-muted">
                    Title
                  </AppText>
                  <AppText variant="body" className="text-acts-ink">
                    {acts.profileTitle}
                  </AppText>
                </View>
              ) : null}
              {acts.cityState ? (
                <View>
                  <AppText variant="caption" className="text-acts-muted">
                    Location
                  </AppText>
                  <AppText variant="body" className="text-acts-ink">
                    {acts.cityState}
                  </AppText>
                </View>
              ) : null}
            </AppCard>
          )}

          {profile.BecomeCategory ? (
            <AppCard className="mb-4 p-4">
              <AppText variant="caption" className="text-acts-muted">
                Become focus
              </AppText>
              <AppText variant="body" className="mt-1 text-acts-ink">
                {profile.BecomeCategory}
              </AppText>
            </AppCard>
          ) : null}

          {profile.TaskDifficulty ? (
            <AppCard className="mb-4 p-4">
              <AppText variant="caption" className="text-acts-muted">
                Preferred task difficulty
              </AppText>
              <AppText variant="body" className="mt-1 capitalize text-acts-ink">
                {profile.TaskDifficulty}
              </AppText>
            </AppCard>
          ) : null}

          {profile.HasKids === true || profile.HasKids === false ? (
            <AppCard className="mb-4 p-4">
              <AppText variant="caption" className="text-acts-muted">
                Kids at home
              </AppText>
              <AppText variant="body" className="mt-1 text-acts-ink">
                {profile.HasKids ? 'Yes' : 'No'}
              </AppText>
            </AppCard>
          ) : null}

          <ChipRow label="Traits" items={profile.Traits ?? []} />
          <ChipRow label="Hobbies" items={profile.Hobbies ?? []} />
          <ChipRow label="Interests" items={profile.Interests ?? []} />
          <ChipRow label="Goals" items={profile.Goals ?? []} />
          <ChipRow label="Growth goals" items={profile.GrowthGoals ?? []} />
          <ChipRow label="Personality" items={profile.PersonalityTraits ?? []} />
          <ChipRow label="Favorite activities" items={profile.FavoriteActivities ?? []} />
        </View>
      ) : null}
    </Screen>
    </>
  );
}
