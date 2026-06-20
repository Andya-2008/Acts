import Ionicons from '@expo/vector-icons/Ionicons';
import { router, Stack, type Href } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Image, Pressable, View } from 'react-native';

import { FriendsCirclePromptCard, shouldShowFriendsCirclePrompt } from '@/features/friends/components/FriendsCirclePromptCard';
import { profileHasSavedPhone } from '@/features/user-profile/utils/profilePhone';
import { mapAuthError } from '@/features/auth/utils/mapAuthError';
import { FriendSuggestionsRail } from '@/features/friends/components/FriendSuggestionsRail';
import {
  useAcceptFriendRequestMutation,
  useCancelOutgoingFriendRequestMutation,
  useDeclineFriendRequestMutation,
  useFriendsListQuery,
  useIncomingFriendRequestsQuery,
  useOutgoingFriendRequestsQuery,
  useRemoveFriendMutation,
  useSendFriendRequestMutation,
  useSendFriendRequestToUidMutation,
} from '@/features/friends/hooks/useFriendsQueries';
import { useFriendSuggestionsWithContacts } from '@/features/friends/hooks/useFriendSuggestionsWithContacts';
import { syncRegisteredContactKeysFromUserInfo } from '@/features/friends/services/registeredContactKeysRepository';
import type { FriendListItem } from '@/features/friends/services/friendsRepository';
import type { FriendSuggestion } from '@/features/friends/services/friendSuggestionsService';
import { validateFriendLookupInput } from '@/features/friends/utils/friendLookup';
import { getBlockedUidSet } from '@/features/safety/blockedUids';
import { useUserInfoQuery } from '@/features/user-profile/hooks/useUserInfoQuery';
import { inviteRewardSummaryLine } from '@/features/friends/inviteRewardConfig';
import { copyInviteLink, shareInviteLink } from '@/features/sharing/inviteShareActions';
import { DeedFeedFriendsTopBar } from '@/features/deed-feed/components/DeedFeedFriendsTopBar';
import { ActsTextInput, AppButton, AppCard, AppText, Screen, TitleWithInfo } from '@/shared/components/ui';
import { getActsTextInputBoxStyle } from '@/shared/components/ui/actsTextInputMetrics';
import { useAuthStore } from '@/shared/stores/authStore';

function friendRequestDisplayName(
  data: { First?: string; Last?: string; Username?: string } | null | undefined,
  uid: string,
  isPending: boolean,
): string {
  const full = [data?.First, data?.Last].filter(Boolean).join(' ').trim();
  if (full.length > 0) {
    return full;
  }
  const u = data?.Username?.trim();
  if (u) {
    return `@${u}`;
  }
  if (isPending) {
    return '…';
  }
  return uid.slice(0, 8);
}

function RowAvatar({ uri }: { uri: string | null | undefined }) {
  const trimmed = typeof uri === 'string' ? uri.trim() : '';
  const has = trimmed.length > 0;
  return (
    <View className="mr-3 h-11 w-11 shrink-0 overflow-hidden rounded-full border border-acts-border/70 bg-acts-canvas">
      {has ? (
        <Image
          source={{ uri: trimmed }}
          className="h-full w-full"
          resizeMode="cover"
          accessibilityIgnoresInvertColors
        />
      ) : (
        <View className="h-full w-full items-center justify-center" accessibilityLabel="No profile photo">
          <Ionicons name="person" size={22} color="#8B6F82" />
        </View>
      )}
    </View>
  );
}

function IncomingRow({
  fromUid,
  onAccept,
  onDecline,
  busy,
}: {
  fromUid: string;
  onAccept: () => void;
  onDecline: () => void;
  busy: boolean;
}) {
  const { data, isPending } = useUserInfoQuery(fromUid);
  const fullName = [data?.First, data?.Last].filter(Boolean).join(' ').trim();
  const rawUsername = data?.Username?.trim();
  const usernameHandle = rawUsername ? `@${rawUsername.replace(/^@+/, '')}` : null;
  const primaryLine =
    fullName.length > 0
      ? fullName
      : usernameHandle ?? (isPending ? '…' : fromUid.slice(0, 8));
  const profileLabel = fullName.length > 0 && usernameHandle ? `${fullName} (${usernameHandle})` : primaryLine;

  const openProfile = () => router.push(`/(app)/profile/${fromUid}` as Href);

  return (
    <View className="mb-3 rounded-2xl border border-acts-border/70 bg-acts-surface px-4 py-3">
      <Pressable
        className="flex-row items-center"
        onPress={openProfile}
        accessibilityRole="button"
        accessibilityLabel={`Open profile for ${profileLabel}`}>
        <RowAvatar uri={data?.profilePicUrl} />
        <View className="min-w-0 flex-1">
          <AppText variant="subtitle" className="text-acts-ink" numberOfLines={2}>
            {primaryLine}
          </AppText>
          {fullName.length > 0 && usernameHandle ? (
            <AppText variant="caption" className="mt-0.5 text-acts-muted" numberOfLines={1}>
              {usernameHandle}
            </AppText>
          ) : null}
        </View>
      </Pressable>
      <View className="mt-3 flex-row gap-2">
        <AppButton
          title="Decline"
          variant="secondary"
          size="compact"
          className="flex-1"
          disabled={busy}
          accessibilityLabel={`Decline friend request from ${profileLabel}`}
          onPress={onDecline}
        />
        <AppButton
          title="Accept"
          size="compact"
          className="flex-1"
          disabled={busy}
          accessibilityLabel={`Accept friend request from ${profileLabel}`}
          onPress={onAccept}
        />
      </View>
    </View>
  );
}

function OutgoingRow({
  toUid,
  onCancel,
  busy,
}: {
  toUid: string;
  onCancel: () => void;
  busy: boolean;
}) {
  const { data, isPending } = useUserInfoQuery(toUid);
  const handle = data?.Username ? `@${data.Username}` : isPending ? '…' : toUid.slice(0, 8);
  const title = friendRequestDisplayName(data, toUid, isPending);
  const showHandleLine = handle !== title;
  return (
    <View className="mb-3 rounded-2xl border border-acts-border/60 bg-acts-surface px-4 py-3">
      <Pressable
        className="flex-row items-center"
        onPress={() => router.push(`/(app)/profile/${toUid}` as Href)}
        accessibilityRole="button"
        accessibilityLabel={`Open profile for ${title}`}>
        <RowAvatar uri={data?.profilePicUrl} />
        <View className="min-w-0 flex-1">
          <AppText variant="subtitle" className="text-acts-ink" numberOfLines={2}>
            {title}
          </AppText>
          <AppText variant="caption" className="mt-0.5 text-acts-muted" numberOfLines={1}>
            {showHandleLine ? `Pending · ${handle}` : 'Pending'}
          </AppText>
        </View>
      </Pressable>
      <AppButton
        title="Cancel request"
        variant="secondary"
        size="compact"
        className="mt-3"
        disabled={busy}
        accessibilityLabel={`Cancel friend request to ${title}`}
        onPress={onCancel}
      />
    </View>
  );
}

function FriendRow({
  f,
  busy,
  onRemove,
}: {
  f: FriendListItem;
  busy: boolean;
  onRemove: () => void;
}) {
  const { data } = useUserInfoQuery(f.friendUid);
  const fullName = [f.First ?? data?.First, f.Last ?? data?.Last].filter(Boolean).join(' ').trim();
  const rawUsername = (f.Username ?? data?.Username)?.trim();
  const usernameHandle = rawUsername ? `@${rawUsername.replace(/^@+/, '')}` : null;
  const primaryLine = fullName.length > 0 ? fullName : usernameHandle ?? 'Friend';
  const showHandleLine = fullName.length > 0 && usernameHandle != null;
  return (
    <View className="mb-3 rounded-2xl border border-acts-border/60 bg-acts-surface px-4 py-3">
      <Pressable
        className="flex-row items-center"
        onPress={() => router.push(`/(app)/profile/${f.friendUid}` as Href)}
        accessibilityRole="button"
        accessibilityLabel={`Open profile for ${primaryLine}`}>
        <RowAvatar uri={data?.profilePicUrl} />
        <View className="min-w-0 flex-1">
          <AppText variant="subtitle" className="text-acts-ink" numberOfLines={2}>
            {primaryLine}
          </AppText>
          {showHandleLine ? (
            <AppText variant="caption" className="mt-0.5 text-acts-muted" numberOfLines={1}>
              {usernameHandle}
            </AppText>
          ) : null}
        </View>
      </Pressable>
      <AppButton
        title="Remove"
        variant="secondary"
        size="compact"
        className="mt-3"
        disabled={busy}
        accessibilityLabel={`Remove ${primaryLine} from friends`}
        onPress={onRemove}
      />
    </View>
  );
}

export default function FriendsScreen() {
  const uid = useAuthStore((s) => s.user?.uid);
  const [friendLookupInput, setFriendLookupInput] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);
  const [inviteCopied, setInviteCopied] = useState(false);

  const incoming = useIncomingFriendRequestsQuery(uid);
  const outgoing = useOutgoingFriendRequestsQuery(uid);
  const friends = useFriendsListQuery(uid);
  const sendMutation = useSendFriendRequestMutation(uid);
  const sendToUidMutation = useSendFriendRequestToUidMutation(uid);
  const acceptMutation = useAcceptFriendRequestMutation(uid);
  const declineMutation = useDeclineFriendRequestMutation(uid);
  const cancelMutation = useCancelOutgoingFriendRequestMutation(uid);
  const removeMutation = useRemoveFriendMutation(uid);
  const { data: myUserInfo } = useUserInfoQuery(uid);
  const blockedUidSet = useMemo(() => getBlockedUidSet(myUserInfo), [myUserInfo]);
  const friendSuggestions = useFriendSuggestionsWithContacts(uid, blockedUidSet);
  const visibleFriends = useMemo(
    () => (friends.data ?? []).filter((f) => !blockedUidSet.has(f.friendUid)),
    [friends.data, blockedUidSet],
  );
  const visibleContactMatches = useMemo(
    () => friendSuggestions.contactMatches.filter((m) => !blockedUidSet.has(m.uid)),
    [friendSuggestions.contactMatches, blockedUidSet],
  );
  const smallFriendCircle = shouldShowFriendsCirclePrompt(visibleFriends.length);
  const showPhoneHintForFriends = !profileHasSavedPhone(myUserInfo?.Phone);

  useEffect(() => {
    if (!uid) {
      return;
    }
    void syncRegisteredContactKeysFromUserInfo(uid).catch(() => {
      /* keys are best-effort; profile may be missing fields */
    });
  }, [uid]);

  const busy =
    sendMutation.isPending ||
    sendToUidMutation.isPending ||
    acceptMutation.isPending ||
    declineMutation.isPending ||
    cancelMutation.isPending ||
    removeMutation.isPending;

  const confirmRemoveFriend = useCallback(
    (f: FriendListItem) => {
      setLocalError(null);
      const display =
        [f.First, f.Last].filter(Boolean).join(' ').trim() ||
        (f.Username?.trim() ? `@${f.Username.trim()}` : 'this person');
      Alert.alert(
        'Remove friend?',
        `Remove ${display} from your friends?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Remove',
            style: 'destructive',
            onPress: () =>
              removeMutation.mutate(f.friendUid, {
                onError: (e) => setLocalError(mapAuthError(e)),
              }),
          },
        ],
      );
    },
    [removeMutation],
  );

  const onSendFriendLookup = useCallback(() => {
    setLocalError(null);
    const validationError = validateFriendLookupInput(friendLookupInput);
    if (validationError) {
      setLocalError(validationError);
      return;
    }
    sendMutation.mutate(friendLookupInput.trim(), {
      onSuccess: () => setFriendLookupInput(''),
      onError: (e) => setLocalError(mapAuthError(e)),
    });
  }, [friendLookupInput, sendMutation]);

  const outgoingUidSet = useMemo(
    () => new Set((outgoing.data ?? []).map((r) => r.toUid)),
    [outgoing.data],
  );

  const onAddSuggestion = useCallback(
    (s: FriendSuggestion) => {
      setLocalError(null);
      sendToUidMutation.mutate(s.uid, {
        onError: (e) => setLocalError(mapAuthError(e)),
      });
    },
    [sendToUidMutation],
  );

  const onInviteShare = useCallback(() => {
    void shareInviteLink(uid, 'Acts');
  }, [uid]);

  const onInviteCopy = useCallback(() => {
    void copyInviteLink(uid).then(() => {
      setInviteCopied(true);
      setTimeout(() => setInviteCopied(false), 2000);
    });
  }, [uid]);

  if (!uid) {
    return (
      <Screen safeAreaEdges={['left', 'right', 'bottom']}>
        <Stack.Screen options={{ headerShown: false }} />
        <DeedFeedFriendsTopBar />
        <AppText variant="body">Sign in to use friends.</AppText>
      </Screen>
    );
  }

  return (
    <Screen scroll safeAreaEdges={['left', 'right', 'bottom']}>
      <Stack.Screen options={{ headerShown: false }} />
      <DeedFeedFriendsTopBar />
      <TitleWithInfo
        title="Friends"
        showTitle={false}
        className="mb-4"
        infoText="Add people you trust to see their deed photos, react, and comment. Three suggested people refresh regularly — mutual friends appear first. You can also search by username, email, or phone."
      />

      {localError ? (
        <AppText variant="caption" className="mb-4 text-acts-danger">
          {localError}
        </AppText>
      ) : null}

      {smallFriendCircle ? (
        <FriendsCirclePromptCard
          variant="friends_hub"
          friendCount={visibleFriends.length}
          showPhoneHint={showPhoneHintForFriends}
          className="mb-4"
        />
      ) : null}

      {smallFriendCircle ? (
        <>
          <TitleWithInfo
            title="Contacts on Acts"
            variant="label"
            className="mb-2"
            infoText="Scan your contacts to find people already on Acts. Matches you blocked are hidden until you unblock them in Settings → Privacy."
          />
          <AppCard className="mb-6">
            <AppButton
              title={friendSuggestions.contactsLoading ? 'Scanning contacts…' : 'Find friends from contacts'}
              loading={friendSuggestions.contactsLoading}
              disabled={friendSuggestions.contactsLoading}
              accessibilityLabel="Find friends from contacts on this device"
              onPress={() => void friendSuggestions.refreshContacts()}
            />
            {friendSuggestions.contactsPermissionDenied ? (
              <AppText variant="caption" className="mt-3 text-acts-danger">
                Contacts access denied.
              </AppText>
            ) : null}
            {friendSuggestions.contactsLoadError ? (
              <AppText variant="caption" className="mt-3 text-acts-danger">
                {friendSuggestions.contactsLoadError}
              </AppText>
            ) : null}
            {friendSuggestions.contactMatches.length > 0 ? (
              <View className="mt-4 gap-3">
                {visibleContactMatches.map((m) => (
                  <View
                    key={`contact:${m.uid}:${m.matchedVia}:${m.contactLabel}`}
                    className="flex-row items-center justify-between rounded-2xl border border-acts-border/70 bg-acts-surface px-4 py-3">
                    <RowAvatar uri={m.profilePicUrl} />
                    <View className="min-w-0 flex-1 pr-2">
                      <AppText variant="subtitle" className="text-acts-ink">
                        {[m.first, m.last].filter(Boolean).join(' ') || m.contactLabel}
                      </AppText>
                      <AppText variant="caption" className="text-acts-muted">
                        @{m.username}
                      </AppText>
                    </View>
                    <AppButton
                      title="Request"
                      variant="secondary"
                      className="shrink-0"
                      disabled={busy}
                      accessibilityLabel={`Send friend request to ${[m.first, m.last].filter(Boolean).join(' ').trim() || m.contactLabel}`}
                      onPress={() =>
                        sendMutation.mutate(m.username, {
                          onError: (e) => setLocalError(mapAuthError(e)),
                        })
                      }
                    />
                  </View>
                ))}
              </View>
            ) : null}
            {friendSuggestions.contactsSearched &&
            !friendSuggestions.contactsLoading &&
            friendSuggestions.contactMatches.length === 0 &&
            !friendSuggestions.contactsPermissionDenied &&
            !friendSuggestions.contactsLoadError ? (
              <AppText variant="caption" className="mt-3 text-acts-muted">
                No contacts matched an Acts account yet.
              </AppText>
            ) : null}
            {friendSuggestions.contactsSearched &&
            !friendSuggestions.contactsLoading &&
            friendSuggestions.contactMatches.length > 0 &&
            visibleContactMatches.length === 0 &&
            !friendSuggestions.contactsPermissionDenied &&
            !friendSuggestions.contactsLoadError ? (
              <AppText variant="caption" className="mt-3 text-acts-muted">
                Matches hidden (blocked accounts).
              </AppText>
            ) : null}
          </AppCard>
        </>
      ) : null}

      <FriendSuggestionsRail
        suggestions={friendSuggestions.suggestions}
        loading={friendSuggestions.isLoading}
        busy={busy}
        errorMessage={
          friendSuggestions.isError
            ? mapAuthError(friendSuggestions.error)
            : null
        }
        outgoingUidSet={outgoingUidSet}
        onAdd={onAddSuggestion}
        onRefreshNew={() => void friendSuggestions.refreshNewSuggestions()}
      />

      <AppText variant="label" className="mb-2">
        Add by username, email, or phone
      </AppText>
      <AppCard className="mb-6">
        <ActsTextInput
          value={friendLookupInput}
          onChangeText={setFriendLookupInput}
          autoCapitalize="none"
          autoCorrect={false}
          placeholder="username, email, or phone"
          placeholderTextColor="#9CA3AF"
          editable={!busy}
          accessibilityLabel="Friend username, email, or phone"
          accessibilityHint="Enter a username, email, or phone number, then send a friend request"
          onSubmitEditing={onSendFriendLookup}
          returnKeyType="send"
          className="mb-3 rounded-2xl border border-acts-border bg-acts-surface text-acts-ink"
          style={getActsTextInputBoxStyle()}
        />
        <AppButton
          title="Send friend request"
          loading={sendMutation.isPending}
          disabled={busy}
          accessibilityLabel="Send friend request"
          onPress={onSendFriendLookup}
        />
      </AppCard>

      <TitleWithInfo
        title="Contacts on Acts"
        variant="label"
        className="mb-2"
        infoText="Scan your contacts to find people already on Acts. You can also add someone manually with their username, email, or phone above. Matches you blocked are hidden until you unblock them in Settings → Privacy."
      />
      {!smallFriendCircle ? (
        <AppCard className="mb-6">
          <AppButton
            title={friendSuggestions.contactsLoading ? 'Scanning contacts…' : 'Refresh contact scan'}
            variant="secondary"
            loading={friendSuggestions.contactsLoading}
            disabled={friendSuggestions.contactsLoading}
            accessibilityLabel="Refresh contact scan for friend suggestions"
            onPress={() => void friendSuggestions.refreshContacts()}
          />
          {friendSuggestions.contactsPermissionDenied ? (
            <AppText variant="caption" className="mt-3 text-acts-danger">
              Contacts access denied.
            </AppText>
          ) : null}
          {friendSuggestions.contactsLoadError ? (
            <AppText variant="caption" className="mt-3 text-acts-danger">
              {friendSuggestions.contactsLoadError}
            </AppText>
          ) : null}
          {friendSuggestions.contactMatches.length > 0 ? (
            <View className="mt-4 gap-3">
              {visibleContactMatches.map((m) => (
                <View
                  key={`contact:${m.uid}:${m.matchedVia}:${m.contactLabel}`}
                  className="flex-row items-center justify-between rounded-2xl border border-acts-border/70 bg-acts-surface px-4 py-3">
                  <RowAvatar uri={m.profilePicUrl} />
                  <View className="min-w-0 flex-1 pr-2">
                    <AppText variant="subtitle" className="text-acts-ink">
                      {[m.first, m.last].filter(Boolean).join(' ') || m.contactLabel}
                    </AppText>
                    <AppText variant="caption" className="text-acts-muted">
                      @{m.username}
                    </AppText>
                  </View>
                  <AppButton
                    title="Request"
                    variant="secondary"
                    className="shrink-0"
                    disabled={busy}
                    accessibilityLabel={`Send friend request to ${[m.first, m.last].filter(Boolean).join(' ').trim() || m.contactLabel}`}
                    onPress={() =>
                      sendMutation.mutate(m.username, {
                        onError: (e) => setLocalError(mapAuthError(e)),
                      })
                    }
                  />
                </View>
              ))}
            </View>
          ) : null}
          {friendSuggestions.contactsSearched &&
          !friendSuggestions.contactsLoading &&
          friendSuggestions.contactMatches.length === 0 &&
          !friendSuggestions.contactsPermissionDenied &&
          !friendSuggestions.contactsLoadError ? (
            <AppText variant="caption" className="mt-3 text-acts-muted">
              No contacts matched an Acts account yet.
            </AppText>
          ) : null}
          {friendSuggestions.contactsSearched &&
          !friendSuggestions.contactsLoading &&
          friendSuggestions.contactMatches.length > 0 &&
          visibleContactMatches.length === 0 &&
          !friendSuggestions.contactsPermissionDenied &&
          !friendSuggestions.contactsLoadError ? (
            <AppText variant="caption" className="mt-3 text-acts-muted">
              Matches hidden (blocked accounts).
            </AppText>
          ) : null}
        </AppCard>
      ) : null}

      <AppText variant="label" className="mb-2">
        Invite others
      </AppText>
      <AppCard className="mb-6">
        <AppText variant="caption" className="mb-3 leading-5 text-acts-muted">
          {inviteRewardSummaryLine()}
        </AppText>
        <View className="flex-row gap-2">
          <AppButton
            title="Share invite"
            variant="secondary"
            className="flex-1"
            accessibilityLabel="Share Acts invite link"
            onPress={onInviteShare}
          />
          <AppButton
            title={inviteCopied ? 'Copied!' : 'Copy link'}
            variant="secondary"
            className="flex-1"
            accessibilityLabel="Copy Acts invite link"
            onPress={onInviteCopy}
          />
        </View>
      </AppCard>

      <AppText variant="label" className="mb-2">
        Incoming requests
      </AppText>
      {incoming.isPending ? (
        <View className="mb-6 items-center py-4">
          <ActivityIndicator color="#E11D74" />
        </View>
      ) : incoming.data?.length ? (
        <View className="mb-6">
          {incoming.data.map((r) => (
            <IncomingRow
              key={`in:${r.fromUid}`}
              fromUid={r.fromUid}
              busy={busy}
              onAccept={() =>
                acceptMutation.mutate(r.fromUid, {
                  onError: (e) => setLocalError(mapAuthError(e)),
                })
              }
              onDecline={() =>
                declineMutation.mutate(r.fromUid, {
                  onError: (e) => setLocalError(mapAuthError(e)),
                })
              }
            />
          ))}
        </View>
      ) : (
        <AppCard className="mb-6">
          <AppText variant="body" className="text-acts-muted">
            No pending requests.
          </AppText>
        </AppCard>
      )}

      <AppText variant="label" className="mb-2">
        Sent requests
      </AppText>
      {outgoing.isPending ? (
        <View className="mb-6 items-center py-4">
          <ActivityIndicator color="#E11D74" />
        </View>
      ) : outgoing.data?.length ? (
        <View className="mb-6">
          {outgoing.data.map((r) => (
            <OutgoingRow
              key={`out:${r.toUid}`}
              toUid={r.toUid}
              busy={busy}
              onCancel={() =>
                cancelMutation.mutate(r.toUid, {
                  onError: (e) => setLocalError(mapAuthError(e)),
                })
              }
            />
          ))}
        </View>
      ) : (
        <AppCard className="mb-6">
          <AppText variant="body" className="text-acts-muted">
            No outgoing requests.
          </AppText>
        </AppCard>
      )}

      <AppText variant="label" className="mb-2">
        Your friends
      </AppText>
      {friends.isPending ? (
        <View className="mb-6 items-center py-4">
          <ActivityIndicator color="#E11D74" />
        </View>
      ) : visibleFriends.length > 0 ? (
        <View className="mb-6">
          {visibleFriends.map((f) => (
            <FriendRow
              key={`friend:${f.friendUid}`}
              f={f}
              busy={busy}
              onRemove={() => confirmRemoveFriend(f)}
            />
          ))}
        </View>
      ) : (friends.data ?? []).length > 0 ? (
        <AppCard className="mb-8 p-4">
          <TitleWithInfo
            title="No friends to show here"
            className="mb-4"
            infoText="Blocking removes someone from your friend list, but your app may need a moment to refresh. Pull to refresh, or unblock people in Settings → Privacy if you want to send a new request."
          />
          <AppButton
            title="Open Privacy"
            variant="secondary"
            className="self-start"
            accessibilityLabel="Open privacy settings"
            onPress={() => router.push('/(app)/settings/privacy' as Href)}
          />
        </AppCard>
      ) : (
        <AppCard className="mb-8">
          <TitleWithInfo
            title="No friends yet"
            className="mb-4"
            infoText="When someone accepts your request, they will appear here and their deeds will show on the Deed Feed tab."
          />
          <AppButton
            title="Open Deed Feed"
            variant="secondary"
            className="self-start"
            accessibilityLabel="Open deed feed tab"
            onPress={() => router.push('/(app)/(tabs)/deed-feed' as Href)}
          />
        </AppCard>
      )}
    </Screen>
  );
}
