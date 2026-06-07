import Ionicons from '@expo/vector-icons/Ionicons';
import { router, type Href } from 'expo-router';
import { ActivityIndicator, Image, Pressable, View } from 'react-native';

import type { FriendSuggestion } from '@/features/friends/services/friendSuggestionsService';
import { AppButton, AppText } from '@/shared/components/ui';
import { useActAppearance } from '@/shared/providers/ActAppearanceProvider';

const SLOT_COUNT = 3;

type FriendSuggestionsRailProps = {
  suggestions: FriendSuggestion[];
  loading?: boolean;
  busy?: boolean;
  errorMessage?: string | null;
  outgoingUidSet?: Set<string>;
  onAdd: (suggestion: FriendSuggestion) => void;
  onRefreshNew?: () => void;
};

function SuggestionAvatar({ uri }: { uri: string | null }) {
  const trimmed = uri?.trim() ?? '';
  return (
    <View className="mb-2 h-14 w-14 overflow-hidden rounded-full border border-acts-border/70 bg-acts-canvas">
      {trimmed.length > 0 ? (
        <Image source={{ uri: trimmed }} className="h-full w-full" resizeMode="cover" />
      ) : (
        <View className="h-full w-full items-center justify-center">
          <Ionicons name="person" size={24} color="#8B6F82" />
        </View>
      )}
    </View>
  );
}

function displayTitle(s: FriendSuggestion): string {
  const full = [s.first, s.last].filter(Boolean).join(' ').trim();
  if (full.length > 0) {
    return full;
  }
  const u = s.username.trim().replace(/^@+/, '');
  return u ? `@${u}` : 'Acts member';
}

export function FriendSuggestionsRail({
  suggestions,
  loading = false,
  busy = false,
  errorMessage = null,
  outgoingUidSet,
  onAdd,
  onRefreshNew,
}: FriendSuggestionsRailProps) {
  const act = useActAppearance();
  const slots = loading ? [] : suggestions.slice(0, SLOT_COUNT);

  return (
    <View className="mb-6">
      <View className="mb-2 flex-row items-center justify-between">
        <AppText variant="label">Suggested for you</AppText>
        {onRefreshNew ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Show three new friend suggestions"
            onPress={() => void onRefreshNew()}
            disabled={loading || busy}
            className="active:opacity-70">
            <AppText variant="caption" className="font-semibold text-acts-green">
              See new people
            </AppText>
          </Pressable>
        ) : null}
      </View>

      {loading ? (
        <View className="flex-row gap-2">
          {Array.from({ length: SLOT_COUNT }).map((_, index) => (
            <View key={`loading:${index}`} className="flex-1 items-center rounded-2xl border border-acts-border/60 bg-acts-surface py-8">
              <ActivityIndicator color={act.palette.green} />
            </View>
          ))}
        </View>
      ) : slots.length > 0 ? (
        <View className="flex-row gap-2">
          {slots.map((s) => {
            const requested = outgoingUidSet?.has(s.uid) ?? false;
            return (
              <View
                key={`suggest:${s.uid}`}
                className="flex-1 rounded-2xl border border-acts-border/70 bg-acts-surface px-2 py-3">
                <Pressable
                  className="items-center"
                  accessibilityRole="button"
                  accessibilityLabel={`Open profile for ${displayTitle(s)}`}
                  onPress={() => router.push(`/(app)/profile/${s.uid}` as Href)}>
                  <SuggestionAvatar uri={s.profilePicUrl} />
                  <AppText variant="caption" className="text-center font-semibold text-acts-ink" numberOfLines={2}>
                    {displayTitle(s)}
                  </AppText>
                  <AppText variant="caption" className="mt-1 text-center text-acts-muted" numberOfLines={2}>
                    {s.reasonText}
                  </AppText>
                </Pressable>
                <AppButton
                  title={requested ? 'Requested' : 'Add'}
                  variant={requested ? 'secondary' : 'primary'}
                  size="compact"
                  className="mt-2 w-full"
                  disabled={busy || requested}
                  accessibilityLabel={
                    requested ? `Friend request sent to ${displayTitle(s)}` : `Add ${displayTitle(s)}`
                  }
                  onPress={() => onAdd(s)}
                />
              </View>
            );
          })}
        </View>
      ) : (
        <View className="rounded-2xl border border-acts-border/60 bg-acts-surface px-4 py-4">
          {errorMessage ? (
            <AppText variant="caption" className="mb-3 text-acts-danger">
              {errorMessage}
            </AppText>
          ) : null}
          <AppText variant="body" className="mb-2 text-acts-ink">
            No suggestions right now
          </AppText>
          <AppText variant="caption" className="mb-3 leading-5 text-acts-muted">
            {errorMessage
              ? 'Try again in a moment, or add someone by username, email, or phone below.'
              : 'Allow contacts access below to find people you know, or add someone manually.'}
          </AppText>
          {onRefreshNew ? (
            <AppButton
              title="See new people"
              variant="secondary"
              size="compact"
              className="self-start"
              disabled={busy}
              onPress={() => void onRefreshNew()}
            />
          ) : null}
        </View>
      )}
    </View>
  );
}
