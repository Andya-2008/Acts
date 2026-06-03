import { useMemo, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { Stack } from 'expo-router';

import { AppButton, AppCard, AppText, Badge, Screen } from '@/shared/components/ui';
import { HeaderBackLabel } from '@/shared/components/HeaderBackLabel';
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
  const userId = useAuthStore((s) => s.user?.uid);
  const season = useMemo(() => getActiveSeason(), []);
  const daysLeft = useMemo(() => seasonDaysRemaining(season), [season]);

  const { data: progress, isLoading } = useSeasonProgressQuery(userId, season.id);
  const completeMutation = useRecordChallengeCompletionMutation(userId);
  const [error, setError] = useState<string | null>(null);

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

  const onComplete = (challenge: SeasonalChallenge) => {
    setError(null);
    completeMutation.mutate(
      { season, challenge },
      { onError: (e) => setError(mapAuthError(e)) },
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
                </View>
              </View>
              <AppButton
                title={atMax ? 'Completed' : 'Mark complete'}
                variant={atMax ? 'secondary' : 'primary'}
                className="mt-3"
                loading={pendingChallengeId === challenge.id}
                disabled={atMax || !userId || completeMutation.isPending}
                accessibilityLabel={`Mark ${challenge.title} complete`}
                onPress={() => onComplete(challenge)}
              />
            </AppCard>
          );
        })}
      </Screen>
    </>
  );
}
