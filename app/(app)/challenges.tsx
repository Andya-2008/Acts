import { useMemo, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';

import { ActsTextInput, AppButton, AppCard, AppText, Badge, Screen } from '@/shared/components/ui';
import { getActsTextInputBoxStyle } from '@/shared/components/ui/actsTextInputMetrics';
import { HeaderBackLabel } from '@/shared/components/HeaderBackLabel';
import { useReduceMotion } from '@/shared/hooks/useReduceMotion';
import { modalAnimationType } from '@/shared/utils/accessibilityMotion';
import { stackHeaderChrome } from '@/shared/navigation/stackHeaderChrome';
import { useActAppearance } from '@/shared/providers/ActAppearanceProvider';
import { useAuthStore } from '@/shared/stores/authStore';
import { getActiveSeason, seasonDaysRemaining, type SeasonalChallenge } from '@/features/challenges/data/seasons';
import { seasonalChallengeXp } from '@/features/challenges/seasonalChallengeRepository';
import {
  useRecordChallengeCompletionMutation,
  useSeasonProgressQuery,
} from '@/features/challenges/hooks/useSeasonalChallengeQueries';
import { mapAuthError } from '@/features/auth/utils/mapAuthError';

export default function ChallengesScreen() {
  const act = useActAppearance();
  const insets = useSafeAreaInsets();
  const reduceMotion = useReduceMotion();
  const userId = useAuthStore((s) => s.user?.uid);
  const season = useMemo(() => getActiveSeason(), []);
  const daysLeft = useMemo(() => seasonDaysRemaining(season), [season]);

  const { data: progress, isLoading } = useSeasonProgressQuery(userId, season.id);
  const completeMutation = useRecordChallengeCompletionMutation(userId);
  const [error, setError] = useState<string | null>(null);
  const [confirmChallenge, setConfirmChallenge] = useState<SeasonalChallenge | null>(null);
  const [noteText, setNoteText] = useState('');

  const pendingChallengeId = completeMutation.isPending
    ? completeMutation.variables?.challenge.id ?? null
    : null;

  const headerOptions = {
    ...stackHeaderChrome(act),
    headerShown: true as const,
    title: 'Seasonal Challenges',
    headerTitleStyle: { color: act.palette.ink, fontWeight: '800' as const },
    headerLeft: () => <HeaderBackLabel />,
  };

  const openComplete = (challenge: SeasonalChallenge) => {
    setError(null);
    setNoteText('');
    setConfirmChallenge(challenge);
  };

  const submitComplete = () => {
    if (!confirmChallenge) {
      return;
    }
    const challenge = confirmChallenge;
    const note = noteText.trim();
    completeMutation.mutate(
      { season, challenge, note: note.length > 0 ? note : undefined },
      {
        onSuccess: () => {
          setConfirmChallenge(null);
          setNoteText('');
        },
        onError: (e) => setError(mapAuthError(e)),
      },
    );
  };

  if (isLoading) {
    return (
      <>
        <Stack.Screen options={headerOptions} />
        <Screen>
          <View className="flex-1 items-center justify-center py-24">
            <ActivityIndicator size="large" color={act.palette.green} />
          </View>
        </Screen>
      </>
    );
  }

  const completions = progress?.completions ?? {};
  const totalXpEarned = progress?.totalXpEarned ?? 0;

  return (
    <>
      <Stack.Screen options={headerOptions} />
      <Screen scroll>
        <AppCard className="mb-4 border-acts-green/30 bg-acts-green-soft/70 p-4">
          <View className="mb-2 flex-row items-center justify-between">
            <AppText variant="title" className="flex-1 text-acts-ink" numberOfLines={1}>
              {season.name}
            </AppText>
            <Badge label="+50% XP" variant="success" size="sm" />
          </View>
          <AppText variant="body" className="mb-3 text-acts-ink/80">
            {season.subtitle}
          </AppText>
          <View className="flex-row flex-wrap gap-2">
            <Badge label={`${daysLeft} ${daysLeft === 1 ? 'day' : 'days'} left`} variant="info" size="sm" />
            <Badge label={`${totalXpEarned.toLocaleString()} XP earned`} variant="default" size="sm" />
          </View>
        </AppCard>

        {error ? (
          <AppText variant="caption" className="mb-3 text-acts-danger">
            {error}
          </AppText>
        ) : null}

        {season.challenges.map((challenge) => {
          const done = completions[challenge.id] ?? 0;
          const atMax = done >= challenge.maxCompletions;
          const xp = seasonalChallengeXp(season, challenge);
          const lastNote = progress?.notes?.[challenge.id]?.[0];
          return (
            <AppCard key={challenge.id} className="mb-3 p-4">
              <View className="flex-row items-start">
                <View className="mr-3 w-10 items-center justify-center">
                  <AppText style={{ fontSize: 28, lineHeight: 36 }} className="text-center">
                    {challenge.icon}
                  </AppText>
                </View>
                <View className="flex-1">
                  <AppText variant="subtitle" className="text-acts-ink">
                    {challenge.title}
                  </AppText>
                  <AppText variant="caption" className="mt-1 text-acts-muted">
                    {challenge.description}
                  </AppText>
                  <View className="mt-2 flex-row flex-wrap items-center gap-2">
                    <Badge label={`+${xp} XP`} variant="info" size="sm" />
                    <AppText variant="caption" className="text-acts-muted">
                      {done} of {challenge.maxCompletions} this month
                    </AppText>
                  </View>
                  {lastNote ? (
                    <View className="mt-2 rounded-2xl border border-acts-border/70 bg-acts-canvas px-3 py-2">
                      <AppText variant="caption" className="text-acts-muted">
                        Your last note: {lastNote}
                      </AppText>
                    </View>
                  ) : null}
                </View>
              </View>
              <AppButton
                title={atMax ? 'Completed' : done > 0 ? 'Log it again' : 'I did this'}
                variant={atMax ? 'secondary' : 'primary'}
                className="mt-3"
                loading={pendingChallengeId === challenge.id}
                disabled={atMax || !userId || completeMutation.isPending}
                accessibilityLabel={`Log ${challenge.title} as done`}
                onPress={() => openComplete(challenge)}
              />
            </AppCard>
          );
        })}
      </Screen>

      <Modal
        visible={confirmChallenge != null}
        transparent
        animationType={modalAnimationType(reduceMotion, 'fade')}
        onRequestClose={() => {
          if (!completeMutation.isPending) {
            setConfirmChallenge(null);
          }
        }}>
        <Pressable
          className="flex-1 justify-end bg-black/55"
          accessibilityLabel="Dismiss"
          onPress={() => {
            if (!completeMutation.isPending) {
              setConfirmChallenge(null);
            }
          }}>
          <Pressable
            className="rounded-t-3xl border-t-2 border-acts-border bg-acts-surface px-5 pt-5"
            style={{ paddingBottom: Math.max(insets.bottom, 16) }}
            onPress={(e) => e.stopPropagation()}>
            <View className="mb-4 h-1 w-10 self-center rounded-full bg-acts-border" />
            <View className="mb-3 flex-row items-center gap-3">
              <AppText style={{ fontSize: 30, lineHeight: 36 }}>{confirmChallenge?.icon}</AppText>
              <AppText variant="subtitle" className="flex-1 text-acts-ink">
                {confirmChallenge?.title}
              </AppText>
            </View>
            <AppText variant="caption" className="mb-3 leading-5 text-acts-muted">
              Acts runs on the honor system, so just confirm you did this in real life. Add a note
              to remember what you did (optional).
            </AppText>
            <ActsTextInput
              value={noteText}
              onChangeText={setNoteText}
              placeholder="What did you do? (optional)"
              placeholderTextColor="#9CA3AF"
              multiline
              editable={!completeMutation.isPending}
              accessibilityLabel="Note about what you did"
              className="mb-4 rounded-2xl border border-acts-border bg-acts-canvas text-acts-ink"
              style={[getActsTextInputBoxStyle(), { minHeight: 88, textAlignVertical: 'top' }]}
            />
            <View className="flex-row gap-3">
              <AppButton
                title="Cancel"
                variant="secondary"
                className="flex-1"
                disabled={completeMutation.isPending}
                onPress={() => setConfirmChallenge(null)}
              />
              <AppButton
                title="Mark complete"
                className="flex-1"
                loading={completeMutation.isPending}
                disabled={completeMutation.isPending || !userId}
                onPress={submitComplete}
              />
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}
