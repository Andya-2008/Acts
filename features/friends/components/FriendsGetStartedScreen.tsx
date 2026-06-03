import Ionicons from '@expo/vector-icons/Ionicons';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Image, Pressable, ScrollView, Share, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { HeaderIconButton } from '@/shared/components/HeaderIconButton';

import { mapAuthError } from '@/features/auth/utils/mapAuthError';
import {
  clearPostSignupFriendsGatePending,
  getFriendsContactFriendRequestSent,
  getFriendsInviteLinkShared,
  markFriendsContactFriendRequestSent,
  markFriendsGateSkipped,
  markFriendsInviteLinkShared,
} from '@/features/friends/friendsGetStartedStorage';
import { useContactsOnActsMatches } from '@/features/friends/hooks/useContactsOnActsMatches';
import { useFriendUidsQuery, useSendFriendRequestMutation } from '@/features/friends/hooks/useFriendsQueries';
import { AppButton, AppCard, AppText, TitleWithInfo } from '@/shared/components/ui';
import { useActAppearance } from '@/shared/providers/ActAppearanceProvider';
import { useAuthStore } from '@/shared/stores/authStore';
import { useFriendsGateRefreshStore } from '@/shared/stores/friendsGateRefreshStore';

import { getInviteShareMessage } from '@/shared/config/appInvite';

function ContactAvatar({ uri }: { uri: string | null | undefined }) {
  const trimmed = typeof uri === 'string' ? uri.trim() : '';
  return (
    <View className="mr-3 h-11 w-11 shrink-0 overflow-hidden rounded-full border border-acts-border/70 bg-acts-surface">
      {trimmed.length > 0 ? (
        <Image source={{ uri: trimmed }} className="h-full w-full" resizeMode="cover" accessibilityIgnoresInvertColors />
      ) : (
        <View className="h-full w-full items-center justify-center">
          <Ionicons name="person" size={22} color="#8B6F82" />
        </View>
      )}
    </View>
  );
}

function ContactMatchRow({
  match,
  busy,
  requested,
  onRequest,
}: {
  match: {
    uid: string;
    username: string;
    first: string;
    last: string;
    profilePicUrl?: string | null;
    contactLabel: string;
  };
  busy: boolean;
  requested: boolean;
  onRequest: () => void;
}) {
  const fullName = [match.first, match.last].filter(Boolean).join(' ').trim();
  const handle = `@${match.username.replace(/^@+/, '')}`;
  const title = fullName.length > 0 ? fullName : handle;

  return (
    <View className="mb-3 rounded-2xl border border-acts-border/70 bg-acts-surface px-4 py-3">
      <View className="flex-row items-center">
        <ContactAvatar uri={match.profilePicUrl} />
        <View className="min-w-0 flex-1">
          <AppText variant="subtitle" className="text-acts-ink" numberOfLines={2}>
            {title}
          </AppText>
          {fullName.length > 0 ? (
            <AppText variant="caption" className="mt-0.5 text-acts-muted" numberOfLines={1}>
              {handle}
            </AppText>
          ) : (
            <AppText variant="caption" className="mt-0.5 text-acts-muted" numberOfLines={1}>
              {match.contactLabel}
            </AppText>
          )}
        </View>
      </View>
      <AppButton
        title={requested ? 'Requested' : 'Add friend'}
        variant="secondary"
        size="compact"
        className="mt-3"
        disabled={busy || requested}
        accessibilityLabel={
          requested ? `Friend request sent to ${title}` : `Send friend request to ${title}`
        }
        onPress={onRequest}
      />
    </View>
  );
}

type FriendsGetStartedScreenProps = {
  onFinished: () => void;
};

export function FriendsGetStartedScreen({ onFinished }: FriendsGetStartedScreenProps) {
  const uid = useAuthStore((s) => s.user?.uid);
  const act = useActAppearance();
  const friendsQuery = useFriendUidsQuery(uid);
  const [inviteDone, setInviteDone] = useState(false);
  const [contactDone, setContactDone] = useState(false);
  const [requestedUsernames, setRequestedUsernames] = useState<Set<string>>(() => new Set());
  const [gateChecking, setGateChecking] = useState(true);
  const [localError, setLocalError] = useState<string | null>(null);

  const sendMutation = useSendFriendRequestMutation(uid);
  const contactsOnActs = useContactsOnActsMatches(uid);
  const bumpFriendsGate = useFriendsGateRefreshStore((s) => s.bump);

  const refreshGateFlags = useCallback(async () => {
    if (!uid) {
      setInviteDone(false);
      setContactDone(false);
      setGateChecking(false);
      return;
    }
    const friendCount = friendsQuery.data?.length ?? 0;
    const [invite, contact] = await Promise.all([
      getFriendsInviteLinkShared(uid),
      getFriendsContactFriendRequestSent(uid),
    ]);
    setInviteDone(invite);
    setContactDone(contact);
    setGateChecking(false);
    if (friendCount > 0) {
      await clearPostSignupFriendsGatePending(uid);
      bumpFriendsGate();
      onFinished();
    }
  }, [uid, friendsQuery.data?.length, onFinished, bumpFriendsGate]);

  useEffect(() => {
    if (!uid || !friendsQuery.isFetched) {
      return;
    }
    void refreshGateFlags();
  }, [uid, friendsQuery.isFetched, friendsQuery.data?.length, refreshGateFlags]);

  const onInviteShare = useCallback(async () => {
    setLocalError(null);
    try {
      const result = await Share.share({ message: getInviteShareMessage(), title: 'Acts' });
      if (result.action === Share.dismissedAction) {
        return;
      }
      if (uid) {
        await markFriendsInviteLinkShared(uid);
        setInviteDone(true);
      }
    } catch (e) {
      setLocalError(e instanceof Error ? e.message : 'Could not open share sheet.');
    }
  }, [uid]);

  const onContinue = useCallback(async () => {
    setLocalError(null);
    if (uid) {
      await clearPostSignupFriendsGatePending(uid);
    }
    bumpFriendsGate();
    onFinished();
  }, [uid, onFinished, bumpFriendsGate]);

  const onSkip = useCallback(async () => {
    setLocalError(null);
    if (uid) {
      await markFriendsGateSkipped(uid);
    }
    bumpFriendsGate();
    onFinished();
  }, [uid, onFinished, bumpFriendsGate]);

  const onContactFriendRequest = useCallback(
    (username: string) => {
      setLocalError(null);
      const normalized = username.replace(/^@+/, '').trim().toLowerCase();
      sendMutation.mutate(username, {
        onSuccess: async () => {
          if (uid) {
            await markFriendsContactFriendRequestSent(uid);
            setContactDone(true);
          }
          setRequestedUsernames((prev) => {
            const next = new Set(prev);
            next.add(normalized);
            return next;
          });
        },
        onError: (e) => setLocalError(mapAuthError(e)),
      });
    },
    [sendMutation, uid],
  );

  const busy = sendMutation.isPending || gateChecking;

  const dismissHeader = (
    <View className="flex-row justify-start px-4 pb-1 pt-1">
      <HeaderIconButton
        name="close"
        size={28}
        accessibilityLabel="Skip for now"
        className="-ml-1"
        onPress={() => void onSkip()}
      />
    </View>
  );

  if (!uid) {
    return (
      <SafeAreaView className="flex-1 bg-acts-canvas" edges={['top', 'bottom', 'left', 'right']}>
        <View className="flex-1 px-5 py-8">
          <AppText variant="body" className="text-acts-muted">
            Sign in to continue.
          </AppText>
        </View>
      </SafeAreaView>
    );
  }

  if (gateChecking || !friendsQuery.isFetched) {
    return (
      <SafeAreaView className="flex-1 bg-acts-canvas" edges={['top', 'bottom', 'left', 'right']}>
        {dismissHeader}
        <View className="flex-1 items-center justify-center gap-3 px-6">
          <ActivityIndicator size="large" color={act.palette.green} />
          <AppText variant="caption" className="text-center text-acts-muted">
            Loading…
          </AppText>
        </View>
      </SafeAreaView>
    );
  }

  const stepDone = inviteDone || contactDone;

  return (
    <SafeAreaView className="flex-1 bg-acts-canvas" edges={['top', 'bottom', 'left', 'right']}>
      {dismissHeader}
      <ScrollView
        className="flex-1"
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: 40 }}>
        <View className="mb-6 items-center px-1">
          <View
            className="mb-4 h-20 w-20 items-center justify-center rounded-3xl border-2"
            style={{ borderColor: `${act.palette.green}55`, backgroundColor: act.palette.greenSoft }}>
            <Ionicons name="people" size={40} color={act.palette.green} />
          </View>
          <AppText variant="title" className="mb-2 text-center text-acts-ink">
            Invite a friend to finish signing up
          </AppText>
          <AppText variant="body" className="max-w-md text-center leading-6 text-acts-muted">
            Acts is built for people you know. Share an invite link or add someone from your contacts to
            get started.
          </AppText>
        </View>

        {localError ? (
          <AppText variant="caption" className="mb-4 text-acts-danger">
            {localError}
          </AppText>
        ) : null}

        <TitleWithInfo
          title="Option 1 · Share invite link"
          variant="label"
          className="mb-2"
          infoText="Send your link by text, email, or social apps. You can add more friends before continuing."
        />
        <AppCard className="mb-5">
          <AppButton
            title={inviteDone ? 'Share again' : 'Share invite link'}
            variant={inviteDone ? 'secondary' : 'primary'}
            disabled={busy}
            accessibilityLabel={inviteDone ? 'Share invite link again' : 'Share Acts invite link'}
            onPress={() => void onInviteShare()}
          />
        </AppCard>

        <TitleWithInfo
          title="Option 2 · Add from contacts"
          variant="label"
          className="mb-2"
          infoText="We only use contacts on your device to find people already on Acts. Tap Add friend next to someone to send a friend request."
        />
        <AppCard className="mb-5">
          <AppButton
            title={contactsOnActs.loading ? 'Scanning contacts…' : 'Find friends from contacts'}
            variant="secondary"
            loading={contactsOnActs.loading}
            disabled={contactsOnActs.loading}
            accessibilityLabel="Find friends from contacts on this device"
            onPress={() => void contactsOnActs.loadMatches()}
          />
          {contactsOnActs.permissionDenied ? (
            <AppText variant="caption" className="mt-3 text-acts-danger">
              Contacts access was denied. Enable contacts in system settings, or use the invite link above.
            </AppText>
          ) : null}
          {contactsOnActs.loadError ? (
            <AppText variant="caption" className="mt-3 text-acts-danger">
              {contactsOnActs.loadError}
            </AppText>
          ) : null}
          {contactsOnActs.matches.length > 0 ? (
            <View className="mt-4">
              {contactsOnActs.matches.map((m) => {
                const handle = m.username.replace(/^@+/, '').trim().toLowerCase();
                return (
                  <ContactMatchRow
                    key={`contact:${m.uid}:${m.matchedVia}`}
                    match={m}
                    busy={busy}
                    requested={requestedUsernames.has(handle)}
                    onRequest={() => onContactFriendRequest(m.username)}
                  />
                );
              })}
            </View>
          ) : null}
          {contactsOnActs.searched &&
          !contactsOnActs.loading &&
          contactsOnActs.matches.length === 0 &&
          !contactsOnActs.permissionDenied &&
          !contactsOnActs.loadError ? (
            <AppText variant="caption" className="mt-3 leading-5 text-acts-muted">
              No contacts on Acts yet. Share your invite link and try again later.
            </AppText>
          ) : null}
        </AppCard>

        {stepDone ? (
          <AppButton
            title="Continue"
            accessibilityLabel="Continue to Acts"
            onPress={() => void onContinue()}
            disabled={busy}
          />
        ) : (
          <AppText variant="caption" className="text-center leading-5 text-acts-muted">
            Share your invite link or add a friend to continue.
          </AppText>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
