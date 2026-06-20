import Ionicons from '@expo/vector-icons/Ionicons';
import { View } from 'react-native';

import { streakTimeLeftLabel } from '@/features/user-profile/utils/streakAtRisk';
import { AppButton, AppCard, AppText } from '@/shared/components/ui';
import { useActAppearance } from '@/shared/providers/ActAppearanceProvider';
import type { ActTask } from '@/shared/types/task';

type StreakAtRiskCardProps = {
  streakDays: number;
  minutesUntilMidnight: number;
  task: ActTask;
  onDoAct: () => void;
  onDismiss: () => void;
  className?: string;
};

export function StreakAtRiskCard({
  streakDays,
  minutesUntilMidnight,
  task,
  onDoAct,
  onDismiss,
  className = '',
}: StreakAtRiskCardProps) {
  const act = useActAppearance();
  const streakLabel = streakDays === 1 ? '1-day streak' : `${streakDays}-day streak`;

  return (
    <AppCard className={`border-2 border-amber-400/55 bg-amber-50/90 p-4 ${className}`}>
      <View className="mb-2 flex-row items-center">
        <View
          className="mr-2.5 h-10 w-10 items-center justify-center rounded-xl"
          style={{ backgroundColor: `${act.palette.green}28` }}>
          <Ionicons name="flame" size={22} color="#F59E0B" />
        </View>
        <AppText variant="subtitle" className="flex-1 text-acts-ink">
          Keep your {streakLabel}
        </AppText>
      </View>
      <AppText variant="body" className="mb-1 leading-6 text-acts-ink">
        You&apos;re one act away. Complete something before midnight to keep your run going.
      </AppText>
      <AppText variant="caption" className="mb-1 leading-5 text-acts-muted">
        {streakTimeLeftLabel(minutesUntilMidnight)}
      </AppText>
      <AppText variant="subtitle" className="mb-4 mt-2 text-acts-ink" numberOfLines={2}>
        {task.textShort}
      </AppText>
      <AppButton
        title="Do this act"
        className="mb-2 w-full"
        accessibilityLabel={`Scroll to suggested act: ${task.textShort}`}
        onPress={onDoAct}
      />
      <AppButton
        title="Remind me later"
        variant="secondary"
        className="w-full"
        accessibilityLabel="Dismiss streak reminder for today"
        onPress={onDismiss}
      />
    </AppCard>
  );
}
