import Ionicons from '@expo/vector-icons/Ionicons';
import { View } from 'react-native';

import { WIN_BACK_INACTIVE_DAYS } from '@/features/retention/lastActActivity';
import { AppButton, AppCard, AppText } from '@/shared/components/ui';
import { useActAppearance } from '@/shared/providers/ActAppearanceProvider';
import type { ActTask } from '@/shared/types/task';

type WinBackPromptCardProps = {
  daysAway: number;
  task: ActTask | null;
  onDoAct: () => void;
  onLoadActs?: () => void;
  onDismiss: () => void;
  className?: string;
};

export function WinBackPromptCard({
  daysAway,
  task,
  onDoAct,
  onLoadActs,
  onDismiss,
  className = '',
}: WinBackPromptCardProps) {
  const act = useActAppearance();
  const awayLabel = daysAway >= WIN_BACK_INACTIVE_DAYS ? `${daysAway} days` : 'a while';

  return (
    <AppCard className={`border-2 border-acts-blue/45 bg-acts-blue-soft/85 p-4 ${className}`}>
      <View className="mb-2 flex-row items-start">
        <View
          className="mr-3 h-11 w-11 shrink-0 items-center justify-center rounded-2xl"
          style={{ backgroundColor: `${act.palette.green}22` }}>
          <Ionicons name="heart" size={24} color={act.palette.green} />
        </View>
        <View className="min-w-0 flex-1">
          <AppText variant="subtitle" className="text-acts-ink">
            We miss you
          </AppText>
          <AppText variant="caption" className="mt-1 leading-5 text-acts-muted">
            It&apos;s been {awayLabel} since your last act. One small kindness is enough to restart.
          </AppText>
        </View>
      </View>

      {task ? (
        <>
          <AppText variant="subtitle" className="mb-4 mt-1 text-acts-ink" numberOfLines={2}>
            {task.textShort}
          </AppText>
          <AppButton
            title="Do this easy act"
            className="mb-2 w-full"
            accessibilityLabel={`Scroll to easy act: ${task.textShort}`}
            onPress={onDoAct}
          />
        </>
      ) : onLoadActs ? (
        <AppButton title="Load suggested acts" className="mb-2 w-full" onPress={onLoadActs} />
      ) : null}

      <AppButton
        title="Maybe later"
        variant="secondary"
        className="w-full"
        accessibilityLabel="Dismiss win-back reminder"
        onPress={onDismiss}
      />
    </AppCard>
  );
}
