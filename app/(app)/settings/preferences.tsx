import { useEffect, useState } from 'react';
import { View } from 'react-native';

import { ThreeChoiceRow, YesNoRow } from '@/features/settings/components/SettingsRows';
import { useMergeActsSettingsMutation } from '@/features/user-profile/hooks/useUserInfoMutations';
import { useUserInfoQuery } from '@/features/user-profile/hooks/useUserInfoQuery';
import { mergeActsDefaults } from '@/shared/types/actsSettings';
import type { ActsAppSettings } from '@/shared/types/actsSettings';
import { ActsTextInput, AppText, Screen } from '@/shared/components/ui';
import { getActsTextInputBoxStyle } from '@/shared/components/ui/actsTextInputMetrics';
import { useAuthStore } from '@/shared/stores/authStore';

export default function SettingsPreferencesScreen() {
  const uid = useAuthStore((s) => s.user?.uid);
  const { data: userInfo } = useUserInfoQuery(uid);
  const mutation = useMergeActsSettingsMutation(uid);
  const base = mergeActsDefaults(userInfo?.ActsSettings);
  const [minutes, setMinutes] = useState(String(base.timeCommitmentMinutesPerDay));

  useEffect(() => {
    setMinutes(String(base.timeCommitmentMinutesPerDay));
  }, [base.timeCommitmentMinutesPerDay]);

  const patch = (p: Partial<ActsAppSettings>) => {
    void mutation.mutateAsync(p);
  };

  return (
    <Screen scroll>
      <View className="pb-8">
        <ThreeChoiceRow
          label="Preferred Difficulty"
          value={base.preferredDifficulty}
          options={[
            { key: 'easy', label: 'Easy' },
            { key: 'medium', label: 'Medium' },
            { key: 'hard', label: 'Hard' },
          ]}
          onPick={(k) => patch({ preferredDifficulty: k as ActsAppSettings['preferredDifficulty'] })}
          disabled={mutation.isPending}
        />

        <View className="flex-row items-end border-b border-acts-border py-3.5">
          <View className="min-w-0 flex-1">
            <AppText variant="subtitle" className="mb-2 text-acts-ink">
              Time Commitment
            </AppText>
            <ActsTextInput
              value={minutes}
              onChangeText={setMinutes}
              onEndEditing={() => {
                const n = Math.max(1, Math.min(240, Math.floor(Number(minutes) || 15)));
                setMinutes(String(n));
                patch({ timeCommitmentMinutesPerDay: n });
              }}
              keyboardType="number-pad"
              placeholderTextColor="#9CA3AF"
              className="rounded-xl border border-acts-border bg-acts-surface text-acts-ink"
              style={getActsTextInputBoxStyle({ horizontalPadding: 12 })}
            />
          </View>
          <AppText variant="caption" className="ml-2 pb-2 text-acts-muted">
            minutes/day
          </AppText>
        </View>

        <YesNoRow
          label="Photo Comfort"
          value={base.photoComfortYes}
          onPick={(v) => patch({ photoComfortYes: v })}
          disabled={mutation.isPending}
        />

        <ThreeChoiceRow
          label="Gender"
          value={base.gender}
          options={[
            { key: 'male', label: 'Male' },
            { key: 'female', label: 'Female' },
            { key: 'prefer_not', label: 'Prefer not' },
          ]}
          onPick={(k) => patch({ gender: k as ActsAppSettings['gender'] })}
          disabled={mutation.isPending}
        />
      </View>
    </Screen>
  );
}
