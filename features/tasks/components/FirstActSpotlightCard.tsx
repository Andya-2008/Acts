import Ionicons from '@expo/vector-icons/Ionicons';
import { View } from 'react-native';

import { AppButton, AppCard, AppText } from '@/shared/components/ui';
import { useActAppearance } from '@/shared/providers/ActAppearanceProvider';
import type { ActTask } from '@/shared/types/task';

type FirstActSpotlightCardProps = {
  task: ActTask;
  onScrollToAct: () => void;
  onDismiss: () => void;
  className?: string;
};

export function FirstActSpotlightCard({
  task,
  onScrollToAct,
  onDismiss,
  className = '',
}: FirstActSpotlightCardProps) {
  const act = useActAppearance();

  return (
    <AppCard className={`border-2 border-acts-green/50 bg-acts-green-soft/80 p-4 ${className}`}>
      <View className="mb-2 flex-row items-center">
        <View
          className="mr-2.5 h-10 w-10 items-center justify-center rounded-xl"
          style={{ backgroundColor: `${act.palette.green}28` }}>
          <Ionicons name="sparkles" size={22} color={act.palette.green} />
        </View>
        <AppText variant="subtitle" className="flex-1 text-acts-ink">
          Start here: your first act
        </AppText>
      </View>
      <AppText variant="body" className="mb-1 leading-6 text-acts-ink">
        {task.textShort}
      </AppText>
      <AppText variant="caption" className="mb-4 leading-5 text-acts-muted">
        Tap the circle to check it off. You will earn seeds and XP in about a minute.
      </AppText>
      <AppButton
        title="Show me this act"
        className="mb-2 w-full"
        accessibilityLabel="Scroll to your first suggested act"
        onPress={onScrollToAct}
      />
      <AppButton
        title="Maybe later"
        variant="secondary"
        className="w-full"
        accessibilityLabel="Dismiss first act tip"
        onPress={onDismiss}
      />
    </AppCard>
  );
}
