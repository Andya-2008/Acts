import { View } from 'react-native';

import { AppButton, AppText } from '@/shared/components/ui';

type TaskListFocusFooterProps = {
  hiddenCount: number;
  onShowAll: () => void;
};

export function TaskListFocusFooter({ hiddenCount, onShowAll }: TaskListFocusFooterProps) {
  if (hiddenCount <= 0) {
    return null;
  }

  return (
    <View className="mb-4 items-center px-2 py-2">
      <AppText variant="caption" className="mb-3 text-center text-acts-muted">
        Showing your top picks for today. {hiddenCount} more act{hiddenCount === 1 ? '' : 's'} in your roster.
      </AppText>
      <AppButton
        title={`Show all acts (${hiddenCount} more)`}
        variant="secondary"
        className="w-full"
        onPress={onShowAll}
      />
    </View>
  );
}
