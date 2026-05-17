import Ionicons from '@expo/vector-icons/Ionicons';
import { router, type Href } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, Pressable, Share, TextInput, View } from 'react-native';

import { mapAuthError } from '@/features/auth/utils/mapAuthError';
import { useContactsOnActsMatches } from '@/features/friends/hooks/useContactsOnActsMatches';
import {
  useAcceptFriendRequestMutation,
  useCancelOutgoingFriendRequestMutation,
  useDeclineFriendRequestMutation,
  useFriendsListQuery,
  useIncomingFriendRequestsQuery,
  useOutgoingFriendRequestsQuery,
  useRemoveFriendMutation,
  useSendFriendRequestMutation,
} from '@/features/friends/hooks/useFriendsQueries';
import { syncRegisteredContactKeysFromUserInfo } from '@/features/friends/services/registeredContactKeysRepository';
import type { FriendListItem } from '@/features/friends/services/friendsRepository';
import { useUserInfoQuery } from '@/features/user-profile/hooks/useUserInfoQuery';
import { AppButton, AppCard, AppText, Screen } from '@/shared/components/ui';
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
  const handle = data?.Username ? `@${data.Username}` : isPending ? '…' : fromUid.slice(0, 8);
  const title = friendRequestDisplayName(data, fromUid, isPending);
  const showHandleLine = handle !== title;
  return (
    <View className="mb-3 flex-row items-center justify-between rounded-2xl border border-acts-border/70 bg-acts-surface px-4 py-3">
      <Pressable
        className="min-w-0 flex-1 pr-2"
        onPress={() => router.push(`/(app)/profile/${fromUid}` as Href)}
        accessibilityRole="button"
        accessibilityLabel={`Open profile for ${title}`}>
        <AppText variant="subtitle" className="text-acts-ink">
          {title}
        </AppText>
        {showHandleLine ? (
          <AppText variant="caption" className="text-acts-muted">
            {handle}
          </AppText>
        ) : null}
      </Pressable>
      <View className="flex-row gap-2">
        <AppButton title="Decline" variant="secondary" disabled={busy} onPress={onDecline} />
        <AppButton title="Accept" disabled={busy} onPress={onAccept} />
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
    <View className="mb-3 flex-row items-center justify-between rounded-2xl border border-acts-border/60 bg-acts-surface px-4 py-3">
      <RowAvatar uri={data?.profilePicUrl} />
      <Pressable
        className="min-w-0 flex-1 pr-2"
        onPress={() => router.push(`/(app)/profile/${toUid}` as Href)}
        accessibilityRole="button"
        accessibilityLabel={`Open profile for ${title}`}>
        <AppText variant="subtitle" className="text-acts-ink">
          {title}
        </AppText>
        <AppText variant="caption" className="text-acts-muted">
          {showHandleLine ? `Pending · ${handle}` : 'Pending'}
        </AppText>
      </Pressable>
      <AppButton title="Cancel" variant="secondary" disabled={busy} onPress={onCancel} />
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
  const displayName = [f.First, f.Last].filter(Boolean).join(' ') || 'Friend';
  return (
    <View className="mb-3 flex-row items-center justify-between rounded-2xl border border-acts-border/60 bg-acts-surface px-4 py-3">
      <RowAvatar uri={data?.profilePicUrl} />
      <Pressable
        className="min-w-0 flex-1 pr-2"
        onPress={() => router.push(`/(app)/profile/${f.friendUid}` as Href)}
        accessibilityRole="button"
        accessibilityLabel={`Open profile for ${displayName}`}>
        <AppText variant="subtitle" className="text-acts-ink">
          {displayName}
        </AppText>
        <AppText variant="caption" className="text-acts-muted">
          @{f.Username}
        </AppText>
      </Pressable>
      <AppButton title="Remove" variant="secondary" disabled={busy} onPress={onRemove} />
    </View>
  );
}

export default function FriendsScreen() {
  const uid = useAuthStore((s) => s.user?.uid);
  const [usernameInput, setUsernameInput] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);

  const incoming = useIncomingFriendRequestsQuery(uid);
  const outgoing = useOutgoingFriendRequestsQuery(uid);
  const friends = useFriendsListQuery(uid);
  const sendMutation = useSendFriendRequestMutation(uid);
  const acceptMutation = useAcceptFriendRequestMutation(uid);
  const declineMutation = useDeclineFriendRequestMutation(uid);
  const cancelMutation = useCancelOutgoingFriendRequestMutation(uid);
  const removeMutation = useRemoveFriendMutation(uid);
  const contactsOnActs = useContactsOnActsMatches(uid);

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

  const onSendByUsername = useCallback(() => {
    setLocalError(null);
    const u = usernameInput.trim().replace(/^@/, '');
    if (u.length < 3) {
      setLocalError('Enter a username (at least 3 characters).');
      return;
    }
    sendMutation.mutate(u, {
      onSuccess: () => setUsernameInput(''),
      onError: (e) => setLocalError(mapAuthError(e)),
    });
  }, [usernameInput, sendMutation]);

  const onInviteShare = useCallback(() => {
    void Share.share({
      message: 'Join me on Acts — kindness as a habit. https://acts.app',
      title: 'Acts',
    });
  }, []);

  if (!uid) {
    return (
      <Screen>
        <AppText variant="body">Sign in to use friends.</AppText>
      </Screen>
    );
  }

  return (
    <Screen scroll>
      <AppText variant="title" className="mb-4">
        Friends
      </AppText>

      {localError ? (
        <AppText variant="caption" className="mb-4 text-acts-danger">
          {localError}
        </AppText>
      ) : null}

      <AppText variant="label" className="mb-2">
        Add by username
      </AppText>
      <AppCard className="mb-6">
        <TextInput
          value={usernameInput}
          onChangeText={setUsernameInput}
          autoCapitalize="none"
          autoCorrect={false}
          placeholder="username (no @ required)"
          placeholderTextColor="#9CA3AF"
          editable={!busy}
          onSubmitEditing={onSendByUsername}
          returnKeyType="send"
          className="mb-3 rounded-2xl border border-acts-border bg-acts-surface px-4 py-3.5 text-base text-acts-ink"
        />
        <AppButton title="Send friend request" loading={sendMutation.isPending} disabled={busy} onPress={onSendByUsername} />
      </AppCard>

      <AppText variant="label" className="mb-2">
        Contacts on Acts
      </AppText>
      <AppCard className="mb-6">
        <AppButton
          title={contactsOnActs.loading ? 'Scanning contacts…' : 'Find friends from contacts'}
          variant="secondary"
          loading={contactsOnActs.loading}
          disabled={contactsOnActs.loading}
          onPress={() => void contactsOnActs.loadMatches()}
        />
        {contactsOnActs.permissionDenied ? (
          <AppText variant="caption" className="mt-3 text-acts-danger">
            Contacts access denied.
          </AppText>
        ) : null}
        {contactsOnActs.loadError ? (
          <AppText variant="caption" className="mt-3 text-acts-danger">
            {contactsOnActs.loadError}
          </AppText>
        ) : null}
        {contactsOnActs.matches.length > 0 ? (
          <View className="mt-4 gap-3">
            {contactsOnActs.matches.map((m) => (
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
                  disabled={busy}
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
        {contactsOnActs.searched &&
        !contactsOnActs.loading &&
        contactsOnActs.matches.length === 0 &&
        !contactsOnActs.permissionDenied &&
        !contactsOnActs.loadError ? (
          <AppText variant="caption" className="mt-3 text-acts-muted">
            No matches.
          </AppText>
        ) : null}
      </AppCard>

      <AppText variant="label" className="mb-2">
        Invite others
      </AppText>
      <AppCard className="mb-6">
        <AppButton title="Share invite" variant="secondary" onPress={onInviteShare} />
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

      {(friends.isPending || (friends.data?.length ?? 0) > 0) && (
        <>
          <AppText variant="label" className="mb-2">
            Your friends
          </AppText>
          {friends.isPending ? (
            <View className="items-center py-4 pb-8">
              <ActivityIndicator color="#E11D74" />
            </View>
          ) : (
            <View className="pb-8">
              {(friends.data ?? []).map((f) => (
                <FriendRow
                  key={`friend:${f.friendUid}`}
                  f={f}
                  busy={busy}
                  onRemove={() => confirmRemoveFriend(f)}
                />
              ))}
            </View>
          )}
        </>
      )}
    </Screen>
  );
}
