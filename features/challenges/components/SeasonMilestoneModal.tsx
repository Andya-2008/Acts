import { Modal, Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { SeasonalSeason } from '@/features/challenges/data/seasons';
import { milestoneMessage, milestoneTitle, type SeasonMilestone } from '@/features/challenges/seasonMilestones';
import { AppButton, AppText } from '@/shared/components/ui';
import { useReduceMotion } from '@/shared/hooks/useReduceMotion';
import { modalAnimationType } from '@/shared/utils/accessibilityMotion';

type SeasonMilestoneModalProps = {
  visible: boolean;
  season: SeasonalSeason;
  milestone: SeasonMilestone | null;
  sharing?: boolean;
  onShare: () => void;
  onClose: () => void;
};

export function SeasonMilestoneModal({
  visible,
  season,
  milestone,
  sharing = false,
  onShare,
  onClose,
}: SeasonMilestoneModalProps) {
  const insets = useSafeAreaInsets();
  const reduceMotion = useReduceMotion();

  if (!milestone) {
    return null;
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType={modalAnimationType(reduceMotion, 'fade')}
      onRequestClose={onClose}>
      <Pressable className="flex-1 justify-end bg-black/55" accessibilityLabel="Dismiss milestone" onPress={onClose}>
        <Pressable
          className="rounded-t-3xl border-t-2 border-acts-border bg-acts-surface px-5 pt-5"
          style={{ paddingBottom: Math.max(insets.bottom, 16) }}
          onPress={(e) => e.stopPropagation()}>
          <View className="mb-4 h-1 w-10 self-center rounded-full bg-acts-border" />
          <AppText variant="caption" className="mb-1 text-acts-green">
            Season milestone
          </AppText>
          <AppText variant="title" className="mb-2 text-acts-ink">
            {milestoneTitle(milestone)}
          </AppText>
          <AppText variant="body" className="mb-5 leading-6 text-acts-muted">
            {milestoneMessage(milestone, season.name)}
          </AppText>
          <AppButton
            title="Share progress"
            className="mb-2 w-full"
            loading={sharing}
            disabled={sharing}
            onPress={onShare}
          />
          <AppButton title="Keep going" variant="secondary" className="w-full" onPress={onClose} />
        </Pressable>
      </Pressable>
    </Modal>
  );
}
